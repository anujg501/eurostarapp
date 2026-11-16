import express, { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler, ok, fail } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';

// ---------------------------------------------------------------------------
// eSSL / ZKTeco biometric machines — "ADMS" push protocol.
//
// The attendance machine in the office is behind the office router, so the
// server cannot reach in and pull from it. Instead the machine is configured
// (COMM → Cloud Server Setting) with this server's address and it calls us:
//
//   GET  /iclock/cdata?SN=..&options=all   handshake; we reply with settings
//   POST /iclock/cdata?SN=..&table=ATTLOG  punches, one per line (tab-separated)
//   POST /iclock/cdata?SN=..&table=OPERLOG user list changes ("USER PIN=1\tName=…")
//   GET  /iclock/getrequest?SN=..           polls for commands; we reply "OK"
//   POST /iclock/devicecmd?SN=..            command results; we reply "OK"
//
// The machine keeps every punch until we answer "OK", and resumes from the
// Stamp we hand back, so a server outage loses nothing — it just catches up.
//
// Security: only an *approved* serial number may store punches. The very first
// machine that ever connects is approved automatically (trust on first use) so
// setup needs no extra step; any later unknown machine waits for an admin.
// An unapproved machine gets a non-OK reply, so it keeps its data and retries.
// ---------------------------------------------------------------------------

export const iclockRouter = Router();

// Machines send text/plain (sometimes with no content type at all).
iclockRouter.use(express.text({ type: () => true, limit: '20mb' }));

const text = (res: Response, body: string, status = 200) =>
  res.status(status).type('text/plain').send(body);

const snOf = (req: Request) => String(req.query.SN || req.query.sn || '').trim();

async function touchDevice(req: Request) {
  const sn = snOf(req);
  if (!sn || sn.length > 64) return null;
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.ip || null;
  const pushVer = req.query.pushver ? String(req.query.pushver) : undefined;
  const existing = await prisma.bioDevice.findUnique({ where: { sn } });
  if (existing) {
    return prisma.bioDevice.update({
      where: { sn },
      data: { lastSeenAt: new Date(), lastIp: ip, ...(pushVer ? { pushVer } : {}) },
    });
  }
  // Trust on first use: approve automatically only if no machine is approved yet.
  const anyApproved = await prisma.bioDevice.count({ where: { approved: true } });
  return prisma.bioDevice.create({
    data: { sn, approved: anyApproved === 0, lastSeenAt: new Date(), lastIp: ip, pushVer: pushVer ?? null },
  });
}

// "YYYY-MM-DD HH:MM:SS" (also tolerates "YYYY/MM/DD" and a missing seconds part).
export function normaliseTs(s: string): string | null {
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const p = (v: string | undefined) => String(v ?? '0').padStart(2, '0');
  return `${m[1]}-${p(m[2])}-${p(m[3])} ${p(m[4])}:${m[5]}:${p(m[6])}`;
}

// One ATTLOG line: PIN \t time \t status \t verify \t workcode \t reserved…
export function parseAttlog(body: string) {
  const out: { pin: string; ts: string; date: string; status: number | null; verify: number | null; raw: string }[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const pin = (f[0] || '').trim();
    const ts = normaliseTs(f[1] || '');
    if (!pin || !ts || pin.length > 32) continue;
    const num = (v?: string) => (v !== undefined && /^-?\d+$/.test(v.trim()) ? parseInt(v.trim(), 10) : null);
    out.push({ pin, ts, date: ts.slice(0, 10), status: num(f[2]), verify: num(f[3]), raw: line.slice(0, 300) });
  }
  return out;
}

// OPERLOG "USER PIN=1\tName=Anuj\tPri=14\tPasswd=\tCard=\tGrp=1…" lines.
export function parseUsers(body: string) {
  const out: { pin: string; name: string | null; privilege: number | null; card: string | null }[] = [];
  for (const line of body.split(/\r?\n/)) {
    const m = /^\s*USER\s+(.*)$/.exec(line);
    if (!m) continue;
    const kv: Record<string, string> = {};
    for (const part of m[1].split('\t')) {
      const i = part.indexOf('=');
      if (i > 0) kv[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    if (!kv.PIN) continue;
    out.push({
      pin: kv.PIN,
      name: kv.Name || null,
      privilege: kv.Pri && /^\d+$/.test(kv.Pri) ? parseInt(kv.Pri, 10) : null,
      card: kv.Card && kv.Card !== '0' ? kv.Card : null,
    });
  }
  return out;
}

// Handshake. ATTLOGStamp=None asks for the machine's full history the first
// time; after that we hand back the last stamp it reported so it only sends new.
iclockRouter.get(
  '/cdata',
  asyncHandler(async (req, res) => {
    const dev = await touchDevice(req);
    if (!dev) return text(res, 'ERROR: missing SN', 400);
    const lines = [
      `GET OPTION FROM: ${dev.sn}`,
      `ATTLOGStamp=${dev.attlogStamp || 'None'}`,
      `OPERLOGStamp=${dev.operlogStamp || 'None'}`,
      'ATTPHOTOStamp=None',
      'ErrorDelay=60',
      'Delay=30',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TransFlag=TransData AttLog OpLog EnrollUser ChgUser',
      'Realtime=1',
      'Encrypt=None',
    ];
    return text(res, lines.join('\r\n') + '\r\n');
  })
);

iclockRouter.post(
  '/cdata',
  asyncHandler(async (req, res) => {
    const dev = await touchDevice(req);
    if (!dev) return text(res, 'ERROR: missing SN', 400);
    // Not approved: refuse, so the machine keeps the data and retries later.
    if (!dev.approved) return text(res, 'ERROR: device not approved', 403);

    const table = String(req.query.table || '').toUpperCase();
    const body = typeof req.body === 'string' ? req.body : '';
    const stamp = req.query.Stamp ? String(req.query.Stamp) : undefined;

    if (table === 'ATTLOG') {
      const rows = parseAttlog(body);
      if (rows.length) {
        await prisma.bioPunch.createMany({
          data: rows.map((r) => ({ ...r, deviceSn: dev.sn })),
          skipDuplicates: true,
        });
      }
      if (stamp) await prisma.bioDevice.update({ where: { sn: dev.sn }, data: { attlogStamp: stamp } });
      return text(res, `OK: ${rows.length}`);
    }

    if (table === 'OPERLOG') {
      const users = parseUsers(body);
      for (const u of users) {
        await prisma.bioUser.upsert({
          where: { deviceSn_pin: { deviceSn: dev.sn, pin: u.pin } },
          create: { deviceSn: dev.sn, ...u },
          update: { name: u.name, privilege: u.privilege, card: u.card },
        });
      }
      if (stamp) await prisma.bioDevice.update({ where: { sn: dev.sn }, data: { operlogStamp: stamp } });
      const count = body.split(/\r?\n/).filter((l) => l.trim()).length;
      return text(res, `OK: ${count}`);
    }

    // ATTPHOTO, BIODATA, OPTIONS, etc. — not needed; acknowledge so it moves on.
    return text(res, 'OK');
  })
);

// Command poll. We send no commands; the machine may report INFO here.
iclockRouter.get(
  '/getrequest',
  asyncHandler(async (req, res) => {
    const dev = await touchDevice(req);
    if (!dev) return text(res, 'ERROR: missing SN', 400);
    if (req.query.INFO) {
      await prisma.bioDevice.update({ where: { sn: dev.sn }, data: { info: String(req.query.INFO).slice(0, 500) } });
    }
    return text(res, 'OK');
  })
);

iclockRouter.post('/devicecmd', (_req, res) => text(res, 'OK'));
iclockRouter.get('/ping', (_req, res) => text(res, 'OK'));

// ---------------------------------------------------------------------------
// Admin read/approve API — /hr/biometric/*  (office/admin only)
// ---------------------------------------------------------------------------
export const hrBiometricRouter = Router();
const officeOnly = [authenticate, requireRole('office', 'admin')];

// Machines that have connected, with their last contact and punch counts.
hrBiometricRouter.get(
  '/devices',
  ...officeOnly,
  asyncHandler(async (_req, res) => {
    const devices = await prisma.bioDevice.findMany({ orderBy: { createdAt: 'asc' } });
    const counts = await prisma.bioPunch.groupBy({ by: ['deviceSn'], _count: { _all: true }, _max: { ts: true } });
    return ok(
      res,
      devices.map((d) => {
        const c = counts.find((x) => x.deviceSn === d.sn);
        return { ...d, punches: c?._count._all ?? 0, lastPunch: c?._max.ts ?? null };
      })
    );
  })
);

hrBiometricRouter.post(
  '/devices/:sn/approve',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const approved = req.body?.approved !== false;
    const d = await prisma.bioDevice.update({ where: { sn: req.params.sn }, data: { approved } }).catch(() => null);
    if (!d) return fail(res, 404, 'Unknown device');
    return ok(res, d);
  })
);

// People enrolled on the machine (PIN → name), for matching to the staff list.
hrBiometricRouter.get(
  '/users',
  ...officeOnly,
  asyncHandler(async (_req, res) => {
    const users = await prisma.bioUser.findMany();
    users.sort((a, b) => (parseInt(a.pin, 10) || 0) - (parseInt(b.pin, 10) || 0));
    return ok(res, users);
  })
);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Raw punches in a date range: ?from=YYYY-MM-DD&to=YYYY-MM-DD[&pin=7]
hrBiometricRouter.get(
  '/punches',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const from = String(req.query.from || '');
    const to = String(req.query.to || from);
    if (!DATE.test(from) || !DATE.test(to)) return fail(res, 400, 'from/to must be YYYY-MM-DD');
    const pin = req.query.pin ? String(req.query.pin) : undefined;
    const punches = await prisma.bioPunch.findMany({
      where: { date: { gte: from, lte: to }, ...(pin ? { pin } : {}) },
      orderBy: [{ ts: 'asc' }],
      take: 20000,
    });
    return ok(res, punches);
  })
);

// Per person per day: first punch = in, last punch = out.
hrBiometricRouter.get(
  '/daily',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const from = String(req.query.from || '');
    const to = String(req.query.to || from);
    if (!DATE.test(from) || !DATE.test(to)) return fail(res, 400, 'from/to must be YYYY-MM-DD');
    const punches = await prisma.bioPunch.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: [{ ts: 'asc' }],
      take: 50000,
    });
    const names = new Map((await prisma.bioUser.findMany()).map((u) => [u.pin, u.name]));
    const days = new Map<string, { pin: string; name: string | null; date: string; in: string; out: string | null; punches: number }>();
    for (const p of punches) {
      const k = `${p.pin}|${p.date}`;
      const t = p.ts.slice(11, 16);
      const d = days.get(k);
      if (!d) days.set(k, { pin: p.pin, name: names.get(p.pin) ?? null, date: p.date, in: t, out: null, punches: 1 });
      else {
        d.out = t;
        d.punches++;
      }
    }
    return ok(res, [...days.values()]);
  })
);
