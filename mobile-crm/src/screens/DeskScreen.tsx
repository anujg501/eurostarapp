import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Linking,
} from 'react-native';
import {
  api, STAGES,
  type Customer, type Order, type Rfq, type Lead, type Payment, type Escalation, type StaffRole,
} from '../api';
import { theme } from '../theme';
import { PageHead, ROLE_TITLE } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TODAY = new Date().toISOString().slice(0, 10);

// The desk, laid out the way the web CRM lays it out: quick actions first
// (a rep standing in a shop needs one tap, not a menu), then Mira's ranked
// priorities, then the money that is late, then the figures, then who to call
// when something goes wrong.
//
// Every number here is counted from what the server sent. The server already
// scopes each list to the signed-in token — a rep gets their own book — so this
// screen never decides who may see what.
export default function DeskScreen({ navigation, role, onSignOut, active = true, onCounts }: any) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [escalation, setEscalation] = useState<Escalation[]>([]);
  const [who, setWho] = useState<{ name: string; repId?: string }>({ name: '' });
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      // The desk must render even when one of these is unavailable — an
      // enquiry feed that is down should not blank out the money.
      const [me, c, o, r, l, p, e] = await Promise.all([
        api.me().catch(() => null),
        api.customers().catch(() => []),
        api.orders().catch(() => []),
        api.rfqs().catch(() => []),
        api.leads().catch(() => []),
        api.payments().catch(() => []),
        api.escalation().catch(() => []),
      ]);
      if (me) setWho({ name: me.name, repId: me.repId });
      setCustomers(Array.isArray(c) ? c : []);
      setOrders(Array.isArray(o) ? o : []);
      setRfqs(Array.isArray(r) ? r : []);
      setLeads(Array.isArray(l) ? l : []);
      setPayments(Array.isArray(p) ? p : []);
      setEscalation(Array.isArray(e) ? e : []);
    } catch (e: any) {
      setErr(e?.message || 'Could not load your desk.');
      setCustomers([]);
      setOrders([]);
    }
  }, []);

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

  const isRep = role === 'rep';
  const title = isRep ? (who.name || 'My desk') : ROLE_TITLE[role as StaffRole] || 'Dashboard';
  const sub = isRep
    ? `Sales Rep${who.repId ? ` · ${who.repId}` : ''} · My desk`
    : `${who.name || ROLE_TITLE[role as StaffRole]} · Dashboard`;

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
        ) : (
          <>
            {/* Quick actions — the four things a rep does standing in a shop. */}
            <View style={styles.qaGrid}>
              <QuickAction
                primary icon="🛒" label="Take an order" sub="Pick a customer"
                onPress={() => navigation.navigate('Customers', { intent: 'order' })}
              />
              <QuickAction icon="＋" label="Add customer" sub="New account"
                onPress={() => navigation.navigate('AddCustomer')} />
              <QuickAction icon="📋" label="Pipeline" sub={`${coach.overdue.length} due today`}
                onPress={() => navigation.navigate('Pipeline')} />
              <QuickAction icon="📨" label="My RFQs" sub={openRfq ? `${openRfq} open` : 'none open'}
                onPress={() => navigation.navigate('Rfq')} />
            </View>

            {/* Mira Coach — priorities, ranked, exactly as on the web desk. */}
            <View style={styles.coach}>
              <View style={styles.coachHead}>
                <View style={styles.coachAvatar}><Text style={{ fontSize: 16 }}>💎</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachTitle}>Mira Coach · Today's focus</Text>
                  <Text style={styles.coachSub}>Your priorities, ranked</Text>
                </View>
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

            {/* Figures. */}
            <View style={styles.kpis}>
              <Kpi label={isRep ? 'My customers' : 'Customers'} value={customers!.length}
                   sub={isRep ? 'on your book' : 'in the master'} />
              <Kpi label="Orders" value={orders!.length} sub={pending ? `${pending} pending` : 'none pending'} />
              <Kpi label="Open enquiries" value={openRfq} sub={`${rfqs.length} total`} />
              <Kpi label="In the pipeline" value={leads.length}
                   sub={leads.filter((l) => l.stage === 5).length ? `${leads.filter((l) => l.stage === 5).length} ready to order` : 'no hot leads'} />
              <Kpi label="Order value" value={money(value)} sub={`${orders!.length} orders`} wide />
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
                      <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:+91${p.phone}`)}>
                        <Text style={styles.callTxt}>📞 {p.phone}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
              )}
            </View>

            <TouchableOpacity style={styles.signOut} onPress={onSignOut} activeOpacity={0.8}>
              <Text style={styles.signOutTxt}>↩ Sign out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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

  signOut: {
    marginTop: 26, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', backgroundColor: theme.surface,
  },
  signOutTxt: { fontSize: 13.5, fontWeight: '700', color: theme.ink2 },
});
