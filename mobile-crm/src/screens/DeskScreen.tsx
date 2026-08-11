import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Linking, Alert,
} from 'react-native';
import {
  api, STAGES,
  type Customer, type Order, type Rfq, type Lead, type Payment, type Escalation,
  type Rep, type Cart, type Franchise, type Visit, type Summary, type StaffRole,
} from '../api';
import { slabCommission, type Attendance } from '../api';
import { theme } from '../theme';
import { PageHead, ROLE_TITLE } from '../components/Chrome';
import AdminDigest from '../components/AdminDigest';
import CheckIn from '../components/CheckIn';
import Visits from '../components/Visits';
import LogPayment from '../components/LogPayment';
import Broadcast from '../components/Broadcast';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_NAME = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

// The desk, laid out the way the web CRM lays it out: quick actions first
// (a rep standing in a shop needs one tap, not a menu), then Mira's ranked
// priorities, then the money that is late, then the figures, then who to call
// when something goes wrong.
//
// Every number here is counted from what the server sent. The server already
// scopes each list to the signed-in token — a rep gets their own book — so this
// screen never decides who may see what.
export default function DeskScreen({ navigation, role, onSignOut, active = true, onCounts, onNotices }: any) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [escalation, setEscalation] = useState<Escalation[]>([]);
  // Office-only sources. A rep never fetches these — their desk has no use for
  // the whole company's carts, and the server would scope them anyway.
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [franchise, setFranchise] = useState<Franchise[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  // Rep-only: their own record (target, region) and this month's attendance.
  const [me, setMe] = useState<Rep | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payFor, setPayFor] = useState<Order | null>(null);
  const [who, setWho] = useState<{ name: string; repId?: string }>({ name: '' });
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      // The desk must render even when one of these is unavailable — an
      // enquiry feed that is down should not blank out the money.
      // `acct`, not `me` — the rep's own Rep row is held in state under that
      // name, and shadowing it here silently broke the target and rate.
      const [acct, c, o, r, l, p, e] = await Promise.all([
        api.me().catch(() => null),
        api.customers().catch(() => []),
        api.orders().catch(() => []),
        api.rfqs().catch(() => []),
        api.leads().catch(() => []),
        api.payments().catch(() => []),
        api.escalation().catch(() => []),
      ]);
      if (acct) setWho({ name: acct.name, repId: acct.repId });
      setCustomers(Array.isArray(c) ? c : []);
      setOrders(Array.isArray(o) ? o : []);
      setRfqs(Array.isArray(r) ? r : []);
      setLeads(Array.isArray(l) ? l : []);
      setPayments(Array.isArray(p) ? p : []);
      setEscalation(Array.isArray(e) ? e : []);

      // The office dashboard needs the whole business, not one book.
      if (role !== 'rep') {
        const [s, rp, ct, fr, vs] = await Promise.all([
          api.summary().catch(() => null),
          api.reps().catch(() => []),
          api.carts().catch(() => []),
          api.franchise().catch(() => []),
          api.visits().catch(() => []),
        ]);
        setSummary(s);
        setReps(Array.isArray(rp) ? rp : []);
        setCarts(Array.isArray(ct) ? ct : []);
        setFranchise(Array.isArray(fr) ? fr : []);
        setVisits(Array.isArray(vs) ? vs : []);
      } else {
        // A rep needs their own target and rate, and this month's attendance.
        const [rp, att] = await Promise.all([
          api.reps().catch(() => []),
          api.attendance(TODAY.slice(0, 7)).catch(() => []),
        ]);
        setMe((Array.isArray(rp) ? rp : []).find((r) => r.repId === acct?.repId) || null);
        setAttendance(Array.isArray(att) ? att : []);
      }
    } catch (e: any) {
      setErr(e?.message || 'Could not load your desk.');
      setCustomers([]);
      setOrders([]);
    }
  }, [role]);

  // The desk stays mounted behind the other sections, so it reloads whenever it
  // comes back to the front — a customer added in between has to appear. The
  // figures already on screen stay put while that happens, so coming back shows
  // the desk, never an empty one.
  useEffect(() => { if (active) load(); }, [active, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const loading = customers === null || orders === null;
  const pending = (orders || []).filter((o) => o.status === 'pending').length;
  const openRfq = rfqs.filter((r) => r.status === 'open').length;
  const value = (orders || []).reduce((s, o) => s + (o.grand || 0), 0);

  // Month-to-date, and the abandoned-cart money the office chases. These are a
  // fallback for the fields /reports/summary does not carry, and cover the
  // first paint before that call lands.
  const MONTH = TODAY.slice(0, 7);
  const mtdOrders = (orders || []).filter((o) => String(o.date || o.createdAt || '').slice(0, 7) === MONTH);
  const mtdSales = mtdOrders.reduce((s, o) => s + (o.grand || 0), 0);
  const abandonedCarts = carts.filter((c) => c.status === 'abandoned');
  const abandonedValue = abandonedCarts.reduce((s, c) => s + (c.totals?.grand || 0), 0);

  // --- The rep's own numbers, worked out the desktop's way -------------------
  // Commission is marginal across slabs, so the blended rate rises with the
  // month rather than jumping. Only what has actually been collected counts.
  const paidByOrder = useMemo(() => {
    const m = new Map<string, number>();
    payments.filter((p) => p.status === 'confirmed' && p.orderId)
      .forEach((p) => m.set(p.orderId!, (m.get(p.orderId!) || 0) + (p.amount || 0)));
    return m;
  }, [payments]);

  const comm = useMemo(() => slabCommission(mtdSales), [mtdSales]);

  // The minimum target is 50, as on the desktop, even when none is set.
  const target = Math.max(me?.monthlyTarget ?? 0, 50);
  const added = (customers || []).filter((c) => String(c.createdAt || '').slice(0, 7) === TODAY.slice(0, 7)).length;
  const shortBy = Math.max(0, target - added);

  // Credit customers whose terms have run out and whose order is not settled.
  // Cash accounts are never chased, and a confirmed payment stops the reminder.
  const dueAlerts = useMemo(() => {
    const byId = new Map((customers || []).map((c) => [c.id, c]));
    const out: { order: Order; cust?: Customer; overdueDays: number; outstanding: number }[] = [];
    (orders || []).forEach((o) => {
      const cust = byId.get((o as any).customerId) || undefined;
      const terms = cust?.terms;
      if (!terms || terms === 'cash') return;
      const outstanding = (o.grand || 0) - (paidByOrder.get(o.id) || 0);
      if (outstanding <= 0) return;
      const placed = new Date(o.date || o.createdAt || 0);
      if (isNaN(placed.getTime())) return;
      const due = new Date(placed);
      due.setDate(due.getDate() + parseInt(terms, 10));
      const overdueDays = Math.floor((Date.now() - due.getTime()) / 86400000);
      if (overdueDays > 0) out.push({ order: o, cust, overdueDays, outstanding });
    });
    return out.sort((a, b) => b.overdueDays - a.overdueDays);
  }, [orders, customers, paidByOrder]);

  const askForPayment = (o: Order | null) => { setPayFor(o); setPayOpen(true); };
  const asm = escalation.find((p) => p.role === 'asm') || escalation[0];

  // "Remind" — a WhatsApp to the customer about the outstanding amount, which
  // is what a rep actually does. Pre-written so it goes out in one tap, but it
  // opens WhatsApp rather than sending anything on the rep's behalf.
  const remind = (d: { order: Order; cust?: Customer; overdueDays: number; outstanding: number }) => {
    const phone = String(d.cust?.phone || '').replace(/\D/g, '').slice(-10);
    if (!phone) { Alert.alert('No mobile number', 'That customer has no mobile number on file.'); return; }
    const text = encodeURIComponent(
      `Dear ${d.cust?.name || 'Sir/Madam'}, a gentle reminder that ${money(d.outstanding)} against order ${d.order.id} is now ${d.overdueDays} day${d.overdueDays > 1 ? 's' : ''} past its due date. Kindly arrange the payment at your convenience. — ${who.name}, Eurostar`
    );
    Linking.openURL(`https://wa.me/91${phone}?text=${text}`);
  };

  // Mira's game plan for today, from this rep's own numbers.
  const [tip, setTip] = useState('');
  const [thinking, setThinking] = useState(false);
  const askMira = async () => {
    setThinking(true);
    setTip('');
    const summary = [
      `Rep ${who.name} (${who.repId || '—'}).`,
      `This month: ${added}/${target} new customers added, sales ${money(mtdSales)}, commission ${money(comm.total)}.`,
      `Pipeline: ${leads.filter((l) => l.stage === 5).length} ready to order, ${coach.overdue.length} overdue follow-ups.`,
      `Money: ${dueAlerts.length} payments overdue.`,
    ].join(' ');
    try {
      const r = await api.ask(
        `Give me a short game plan for today in 3 bullets, most important first, max 18 words each. Be specific to these numbers. No preamble.\n\n${summary}`,
        'Eurostar CRM — Sales Rep, My desk',
        `crm-app-${who.repId || 'rep'}`
      );
      setTip((r?.reply || r?.message || '').trim() || 'Mira had nothing to add right now.');
    } catch (e: any) {
      setTip(e?.message || 'Could not reach Mira just now.');
    } finally { setThinking(false); }
  };

  // What Mira would put in front of this rep, ranked. Same rules as the web
  // CRM's coach card, computed from the same records.
  const coach = useMemo(() => {
    const hot = leads.filter((l) => l.stage === 5);
    const overdue = leads.filter((l) => l.stage >= 1 && l.stage < 6 && !!l.followUp && l.followUp <= TODAY);
    const samples = leads.filter((l) => l.stage === 3 || l.stage === 4);
    const unpaid = payments.filter((p) => p.status === 'pending');
    const unpaidTotal = unpaid.reduce((s, p) => s + (p.amount || 0), 0);

    const out: { icon: string; tone: Tone; title: string; detail: string; go?: string }[] = [];
    if (hot.length)
      out.push({
        icon: '🔥', tone: 'win',
        title: `${hot.length} customer${hot.length > 1 ? 's' : ''} ready to order`,
        detail: `${hot.slice(0, 3).map((l) => l.name).join(', ')}${hot.length > 3 ? '…' : ''} said they'll buy. Call today and place the order while it's warm.`,
        go: 'Pipeline',
      });
    if (unpaid.length)
      out.push({
        icon: '💰', tone: 'urgent',
        title: `${unpaid.length} payment${unpaid.length > 1 ? 's' : ''} awaiting verification · ${money(unpaidTotal)}`,
        detail: 'Logged but not yet confirmed by the back office. Chase the ones that have been sitting.',
        go: 'Orders',
      });
    if (overdue.length)
      out.push({
        icon: '⏰', tone: 'warn',
        title: `${overdue.length} follow-up${overdue.length > 1 ? 's' : ''} overdue`,
        detail: `${overdue.slice(0, 3).map((l) => l.name).join(', ')} are waiting on you — a quick call keeps them moving down the pipeline.`,
        go: 'Pipeline',
      });
    if (samples.length)
      out.push({
        icon: '🧪', tone: 'info',
        title: `${samples.length} sample${samples.length > 1 ? 's' : ''} in play`,
        detail: 'Chase feedback on these trials before they cool off — that is where white-round volume begins.',
        go: 'Pipeline',
      });
    if (pending)
      out.push({
        icon: '📦', tone: 'warn',
        title: `${pending} order${pending > 1 ? 's' : ''} waiting to be confirmed`,
        detail: 'Confirm or chase these so the customer is not left wondering.',
        go: 'Orders',
      });
    if (!out.length)
      out.push({
        icon: '✅', tone: 'win',
        title: 'You are on top of everything',
        detail: 'No overdue follow-ups, unverified payments or unconfirmed orders. Keep nurturing relationships.',
      });
    return { items: out.slice(0, 4), overdue };
  }, [leads, payments, pending]);

  // The desk already holds every number the chip rail badges, so it feeds them
  // up rather than the rail fetching anything of its own.
  useEffect(() => {
    onCounts?.({ Orders: pending, Rfq: openRfq, Pipeline: coach.overdue.length });
  }, [onCounts, pending, openRfq, coach.overdue.length]);

  // What the bell lists: one row per thing genuinely waiting — an order to
  // confirm, an enquiry nobody has answered, a follow-up that has come due.
  // Same three sources the web console's bell reads.
  useEffect(() => {
    const list: { icon: string; title: string; sub: string; go?: string }[] = [];
    (orders || [])
      .filter((o) => o.status === 'pending')
      .slice(0, 5)
      .forEach((o) => list.push({
        icon: '🟢',
        title: `New order ${o.id}`,
        sub: `${o.custName || o.customerName || o.customer || 'Customer'} · ${money(o.grand)} — waiting to be confirmed`,
        go: 'Orders',
      }));
    rfqs.filter((r) => r.status === 'open').slice(0, 5).forEach((r) => list.push({
      icon: '📩',
      title: `RFQ ${r.id.slice(0, 10)}`,
      sub: `${r.custName || 'Enquiry'}${r.city ? ` · ${r.city}` : ''} — open`,
      go: 'Rfq',
    }));
    coach.overdue.slice(0, 5).forEach((l) => list.push({
      icon: '⏰',
      title: `Follow-up due · ${l.name}`,
      sub: `${(STAGES.find((s) => s.id === l.stage) || {}).label || ''}${l.followUp ? ` · ${l.followUp}` : ''}`,
      go: 'Pipeline',
    }));
    onNotices?.(list);
  }, [onNotices, orders, rfqs, coach.overdue]);

  const isRep = role === 'rep';
  const title = isRep ? (who.name || 'My desk') : ROLE_TITLE[role as StaffRole] || 'Dashboard';
  // The active chip already says which section this is, so repeating it here
  // only pushed the rep's id off the end of the line.
  const sub = isRep
    ? `Sales Rep${who.repId ? ` · ${who.repId}` : ''}`
    : who.name || ROLE_TITLE[role as StaffRole];

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead title={title} sub={sub} action="+ Add customer" onAction={() => navigation.navigate('AddCustomer')} />

      <ScrollView
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
      >
        {!!err && <View style={styles.err}><Text style={styles.errTxt}>{err}</Text></View>}

        {loading ? (
          <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
        ) : !isRep ? (
          /* ---- Office / Administration ----------------------------------
             The whole business rather than one book: Mira's attention queue,
             the reps to control, then the headline figures. Ported from
             AdminDashboard + AdminCoachDigest in the web console. */
          <>
            <AdminDigest
              orders={orders!} payments={payments} leads={leads} rfqs={rfqs}
              carts={carts} franchise={franchise} visits={visits}
              reps={reps} customers={customers!}
              navigate={(t) => navigation.navigate(t)}
            />

            <View style={styles.kpis}>
              <Kpi label="Total sales (MTD)" value={money(summary?.mtdSales ?? mtdSales)}
                   sub={`${summary?.ordersMonth ?? mtdOrders.length} orders this month`} />
              <Kpi label="Orders" value={summary?.orders ?? orders!.length}
                   sub={`${summary?.pendingOrders ?? pending} awaiting review`} />
              <Kpi label="Open carts" value={summary?.openCarts ?? carts.filter((c) => c.status === 'active').length}
                   sub={`${money(summary?.openCartsValue ?? 0)} in play`} />
              <Kpi label="Abandoned value" value={money(abandonedValue)}
                   sub={`${abandonedCarts.length} cart${abandonedCarts.length === 1 ? '' : 's'} to recover`} />
              <Kpi label="Active customers" value={summary?.activeCustomers ?? customers!.length}
                   sub={`across ${summary?.reps ?? reps.length} reps`} wide />
            </View>

            <Text style={styles.sec}>Recent orders</Text>
            {orders!.slice(0, 6).map((o) => (
              <TouchableOpacity key={o.id} style={styles.line} activeOpacity={0.7}
                                onPress={() => navigation.navigate('Orders')}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.lineTitle} numberOfLines={1}>{o.custName || o.customerName || o.customer || 'Customer'}</Text>
                  <Text style={styles.lineMeta}>{o.id} · {o.status}{(o as any).rep ? ` · ${(o as any).rep}` : ''}</Text>
                </View>
                <Text style={styles.amount}>{money(o.grand)}</Text>
              </TouchableOpacity>
            ))}
            {!orders!.length && <Text style={styles.empty}>No orders yet.</Text>}
          </>
        ) : (
          <>
            {/* Attendance first, as on the desktop: no photo, no day. */}
            <CheckIn month={attendance} onMarked={load} />

            {/* Quick actions — the four things a rep does standing in a shop. */}
            <View style={styles.qaGrid}>
              {/* The desktop opens a customer picker here; on the phone the
                  customers section IS that picker, with search and a Take an
                  order button on every row. */}
              <QuickAction
                primary icon="🛒" label="Take an order" sub="Pick a customer"
                onPress={() => navigation.navigate('Customers')}
              />
              <QuickAction icon="＋" label="Add customer" sub="New account"
                onPress={() => navigation.navigate('AddCustomer')} />
              <QuickAction icon="💰" label="Log payment" sub="Record collection"
                onPress={() => askForPayment(dueAlerts[0]?.order || null)} />
              {asm ? (
                <QuickAction icon="📞" label="Call manager" sub={asm.name}
                  onPress={() => Linking.openURL(`tel:+91${asm.phone}`)} />
              ) : (
                <QuickAction icon="📋" label="Pipeline" sub={`${coach.overdue.length} due today`}
                  onPress={() => navigation.navigate('Pipeline')} />
              )}
            </View>

            {/* Customer visits — GPS in, OTP out. */}
            <Visits customers={customers!} onChanged={load} />

            {/* Mira Coach — priorities, ranked, exactly as on the web desk. */}
            <View style={styles.coach}>
              <View style={styles.coachHead}>
                <View style={styles.coachAvatar}><Text style={{ fontSize: 16 }}>💎</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.coachTitle}>Mira Coach · Today's focus</Text>
                  <Text style={styles.coachSub}>Your priorities, ranked</Text>
                </View>
                <TouchableOpacity
                  style={[styles.coachBtn, thinking && { opacity: 0.6 }]}
                  onPress={askMira}
                  disabled={thinking}
                >
                  <Text style={styles.coachBtnTxt}>{thinking ? 'Thinking…' : '💬 Game plan'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
                {coach.items.map((it, i) => (
                  <View key={i} style={[styles.insight, i > 0 && styles.insightSep]}>
                    <View style={[styles.insightIcon, { backgroundColor: TONE_BG[it.tone] }]}>
                      <Text style={{ fontSize: 14 }}>{it.icon}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.insightTitle, { color: TONE_FG[it.tone] }]}>{it.title}</Text>
                      <Text style={styles.insightDetail}>{it.detail}</Text>
                    </View>
                    {!!it.go && (
                      <TouchableOpacity style={styles.ghost} onPress={() => navigation.navigate(it.go!)}>
                        <Text style={styles.ghostTxt}>Open →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {!!tip && (
                  <View style={styles.tip}>
                    <Text style={styles.tipLabel}>MIRA'S GAME PLAN</Text>
                    <Text style={styles.tipTxt}>{tip}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Follow-ups that have come due. Ruby card, same as the web. */}
            {coach.overdue.length > 0 && (
              <View style={styles.alert}>
                <Text style={styles.alertTitle}>
                  ⚠ {coach.overdue.length} follow-up{coach.overdue.length > 1 ? 's' : ''} due — call today
                </Text>
                {coach.overdue.slice(0, 4).map((l, i) => (
                  <View key={l.id} style={[styles.alertRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.rubyBorder }]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.alertName} numberOfLines={1}>{l.name}</Text>
                      <Text style={styles.alertMeta}>
                        {(STAGES.find((s) => s.id === l.stage) || {}).label || `Stage ${l.stage}`}
                        {l.followUp ? ` · due ${l.followUp}` : ''}
                      </Text>
                    </View>
                    {!!l.mobile && (
                      <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${l.mobile}`)}>
                        <Text style={styles.callTxt}>📞 Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Money that is late. Ruby card, one row per overdue order. */}
            {dueAlerts.length > 0 && (
              <View style={styles.alert}>
                <Text style={styles.alertTitle}>
                  ⚠ {dueAlerts.length} payment{dueAlerts.length > 1 ? 's' : ''} overdue — follow up
                </Text>
                {dueAlerts.slice(0, 5).map((d, i) => {
                  const logged = payments.find((p) => p.orderId === d.order.id && p.status !== 'failed');
                  return (
                    <View key={d.order.id} style={[styles.alertRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.rubyBorder }]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.alertName} numberOfLines={1}>
                          {d.cust?.name || d.order.custName || 'Customer'} · {d.order.id}
                        </Text>
                        <Text style={styles.alertMeta}>
                          {d.cust?.terms || '—'}-day terms · {d.overdueDays} day{d.overdueDays > 1 ? 's' : ''} overdue · {money(d.outstanding)} outstanding
                        </Text>
                      </View>
                      {logged?.status === 'confirmed' ? (
                        <Text style={styles.paid}>✓ Paid</Text>
                      ) : logged?.status === 'pending' ? (
                        <Text style={styles.pendingPill}>Pending verification</Text>
                      ) : (
                        <View style={styles.dueBtns}>
                          <TouchableOpacity style={styles.ghost} onPress={() => remind(d)}>
                            <Text style={styles.ghostTxt}>Remind</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.callBtn} onPress={() => askForPayment(d.order)}>
                            <Text style={styles.callTxt}>Log payment</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* New-customer target for the month. */}
            {shortBy > 0 && (
              <View style={styles.amberCard}>
                <Text style={styles.amberTitle}>
                  🎯 {shortBy} new customer{shortBy > 1 ? 's' : ''} still to add this month
                </Text>
                <Text style={styles.amberSub}>Target {target} · added {added} · {MONTH_NAME}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, Math.round((added / target) * 100))}%` }]} />
                </View>
              </View>
            )}

            {/* Figures — the four the desktop shows a rep. */}
            <View style={styles.kpis}>
              <Kpi label="My customers" value={customers!.length} sub={me?.region || 'on your book'} />
              <Kpi label={`New adds (${MONTH_NAME.split(' ')[0]})`} value={`${added} / ${target}`}
                   sub={shortBy > 0 ? `${shortBy} pending` : 'target met ✓'} />
              <Kpi label="My sales (MTD)" value={money(mtdSales)}
                   sub={`${mtdOrders.length} order${mtdOrders.length === 1 ? '' : 's'}`} />
              <Kpi label="My commission" value={money(comm.total)}
                   sub={`blended ${(comm.effectiveRate * 100).toFixed(2)}%`} />
              <Kpi label="Open enquiries" value={openRfq} sub={`${leads.length} in the pipeline`} wide />
            </View>

            {/* Recent orders. */}
            <Text style={styles.sec}>Recent orders</Text>
            {orders!.slice(0, 5).map((o) => (
              <TouchableOpacity key={o.id} style={styles.line} activeOpacity={0.7}
                                onPress={() => navigation.navigate('Orders')}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.lineTitle} numberOfLines={1}>{o.custName || o.customerName || o.customer || 'Customer'}</Text>
                  <Text style={styles.lineMeta}>{o.id} · {o.status}</Text>
                </View>
                <Text style={styles.amount}>{money(o.grand)}</Text>
              </TouchableOpacity>
            ))}
            {!orders!.length && <Text style={styles.empty}>No orders yet.</Text>}

            {/* Escalation ladder — who to ring, in order, when the field goes wrong. */}
            <Text style={styles.sec}>Escalation — contact in this order</Text>
            <View style={styles.card}>
              {escalation.length === 0 ? (
                <Text style={styles.empty}>
                  No escalation contacts assigned yet. Admin sets these from Reps &amp; commission.
                </Text>
              ) : (
                escalation
                  .slice()
                  .sort((a, b) => (a.role === 'asm' ? -1 : 1) - (b.role === 'asm' ? -1 : 1))
                  .map((p, i) => (
                    <View key={p.id} style={[styles.escRow, i > 0 && styles.insightSep]}>
                      <View style={styles.escNum}><Text style={styles.escNumTxt}>{i + 1}</Text></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.escRole}>
                          {p.role === 'asm' ? 'Step 1 · Area Sales Manager' : 'Step 2 · if not resolved by ASM'}
                        </Text>
                        <Text style={styles.escName} numberOfLines={1}>{p.name}</Text>
                      </View>
                      <View style={styles.dueBtns}>
                        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:+91${p.phone}`)}>
                          <Text style={styles.callTxt}>📞 Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.ghost}
                          onPress={() => Linking.openURL(`https://wa.me/91${String(p.phone).replace(/\D/g, '').slice(-10)}`)}
                        >
                          <Text style={styles.ghostTxt}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <LogPayment
        visible={payOpen}
        orders={orders || []}
        preset={payFor}
        onClose={() => setPayOpen(false)}
        onLogged={load}
      />

      {/* The office's broadcast to the field — once a day, and again whenever
          it is re-pushed. Reps only; the office writes these, it does not
          need to be told them. */}
      {isRep && <Broadcast />}
    </View>
  );
}

type Tone = 'win' | 'urgent' | 'warn' | 'info';
const TONE_BG: Record<Tone, string> = {
  win: theme.emeraldSoft, urgent: theme.rubySoft, warn: theme.amberSoft, info: theme.card,
};
const TONE_FG: Record<Tone, string> = {
  win: theme.emeraldInk, urgent: theme.ruby, warn: theme.amber, info: theme.ink,
};

function QuickAction({ icon, label, sub, onPress, primary }: {
  icon: string; label: string; sub: string; onPress: () => void; primary?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.qa, primary && styles.qaPrimary]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.qaIcon}>{icon}</Text>
      <Text style={[styles.qaLabel, primary && styles.qaLabelOn]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.qaSub, primary && styles.qaSubOn]} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

function Kpi({ label, value, sub, wide }: { label: string; value: number | string; sub?: string; wide?: boolean }) {
  return (
    <View style={[styles.kpi, wide && { width: '100%' }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  err: { backgroundColor: theme.rubySoft, borderWidth: 1, borderColor: '#E6C9C9', borderRadius: 12, padding: 12, marginBottom: 14 },
  errTxt: { color: theme.ruby, fontSize: 13 },

  // Monthly new-customer target
  amberCard: {
    backgroundColor: theme.amberSoft, borderWidth: 1, borderColor: theme.amberBorder,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  amberTitle: { fontSize: 13.5, fontWeight: '700', color: theme.amber },
  amberSub: { fontSize: 12.5, color: theme.amber, marginTop: 3, opacity: 0.85 },
  barTrack: { height: 6, borderRadius: 999, backgroundColor: 'rgba(122,82,20,0.18)', marginTop: 10, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 999, backgroundColor: theme.emerald },

  paid: { fontSize: 12, fontWeight: '700', color: theme.emeraldInk, flexShrink: 0 },
  pendingPill: {
    fontSize: 11, fontWeight: '700', color: theme.amber, backgroundColor: theme.amberSoft,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden', flexShrink: 0, maxWidth: 110,
  },

  // Quick actions
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  qa: {
    width: '47.5%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 13,
  },
  qaPrimary: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  qaIcon: { fontSize: 19 },
  qaLabel: { fontSize: 14, fontWeight: '700', color: theme.ink, marginTop: 8 },
  qaLabelOn: { color: '#fff' },
  qaSub: { fontSize: 11.5, color: theme.meta, marginTop: 2 },
  qaSubOn: { color: 'rgba(255,255,255,0.78)' },

  // Mira Coach
  coach: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, overflow: 'hidden', marginBottom: 18,
  },
  coachHead: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.emerald,
  },
  coachAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  coachTitle: { color: '#FDFAF2', fontSize: 14, fontWeight: '700' },
  coachSub: { color: 'rgba(253,250,242,0.82)', fontSize: 11.5, marginTop: 1 },
  coachBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0,
  },
  coachBtnTxt: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  tip: {
    marginTop: 10, marginBottom: 6, padding: 12, borderRadius: 10, backgroundColor: theme.emeraldSoft,
  },
  tipLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: theme.emeraldInk, marginBottom: 4 },
  tipTxt: { fontSize: 13, lineHeight: 20, color: theme.emeraldInk },

  dueBtns: { flexDirection: 'row', gap: 6, flexShrink: 0 },

  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 11 },
  insightSep: { borderTopWidth: 1, borderTopColor: theme.divider },
  insightIcon: {
    width: 29, height: 29, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  insightTitle: { fontSize: 13.5, fontWeight: '700' },
  insightDetail: { fontSize: 12.5, color: theme.meta, marginTop: 2, lineHeight: 18 },
  ghost: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 6, flexShrink: 0, backgroundColor: theme.card,
  },
  ghostTxt: { fontSize: 11.5, fontWeight: '700', color: theme.ink2 },

  // Overdue follow-ups
  alert: {
    backgroundColor: theme.rubySoft, borderWidth: 1, borderColor: theme.rubyBorder,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  alertTitle: { fontSize: 13.5, fontWeight: '700', color: theme.ruby, marginBottom: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  alertName: { fontSize: 13.5, fontWeight: '700', color: theme.ink },
  alertMeta: { fontSize: 12, color: theme.meta, marginTop: 1 },

  callBtn: {
    backgroundColor: theme.emerald, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0,
  },
  callTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Figures
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: {
    width: '47.5%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 14,
  },
  kpiLabel: { fontSize: 11, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  kpiValue: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 4 },
  kpiSub: { fontSize: 11.5, color: theme.meta, marginTop: 2 },

  sec: { fontSize: 13, fontWeight: '800', color: theme.ink, marginTop: 24, marginBottom: 10 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 14 },

  line: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  lineTitle: { fontSize: 14, fontWeight: '600', color: theme.ink },
  lineMeta: { fontSize: 12, color: theme.meta, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700', color: theme.emeraldInk, flexShrink: 0 },
  empty: { fontSize: 13, color: theme.meta, paddingVertical: 12, lineHeight: 19 },

  escRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  escNum: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: theme.emeraldSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  escNumTxt: { color: theme.emeraldInk, fontWeight: '800', fontSize: 14 },
  escRole: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: theme.meta },
  escName: { fontSize: 14.5, fontWeight: '600', color: theme.ink, marginTop: 1 },
});
