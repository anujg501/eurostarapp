import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Modal, TextInput, Alert,
} from 'react-native';
import { api, type Rep, type Attendance, type Visit, type Customer, type Order } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const MONTH_NAME = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const at = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

// A visit still open after its day has ended never got checked out.
const failedVisit = (v: Visit) => !v.checkOut && !!v.day && Date.now() > new Date(`${v.day}T23:59:59`).getTime();

/**
 * The team, in one place: who is out today, who is behind, and what the office
 * pays them.
 *
 * The desktop splits this across Reps & commission, Attendance and Field Visits.
 * On a phone the office is checking one thing — "is the field working today?" —
 * so the three answers sit together rather than three taps apart.
 */
export default function TeamScreen({ navigation, active = true }: any) {
  const [reps, setReps] = useState<Rep[] | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState<Rep | null>(null);
  const [pct, setPct] = useState('');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([
      api.reps().catch(() => []),
      api.attendance(MONTH).catch(() => []),
      api.visits().catch(() => []),
      api.customers().catch(() => []),
      api.orders().catch(() => []),
    ])
      .then(([r, a, v, c, o]) => {
        setReps(Array.isArray(r) ? r : []);
        setAttendance(Array.isArray(a) ? a : []);
        setVisits(Array.isArray(v) ? v : []);
        setCustomers(Array.isArray(c) ? c : []);
        setOrders(Array.isArray(o) ? o : []);
      })
      .catch((e) => { setErr(e?.message || 'Could not load the team.'); setReps([]); });
  };

  useEffect(() => { if (active) load(); }, [active]);

  const openVisits = visits.filter((v) => !v.checkOut && !failedVisit(v));
  const todaysVisits = visits.filter((v) => v.day === TODAY);
  const presentToday = attendance.filter((a) => a.date === TODAY && a.status === 'present');

  const rows = useMemo(() => {
    return (reps || []).map((r) => {
      const mine = customers.filter((c) => c.rep === r.repId);
      const added = mine.filter((c) => String(c.createdAt || '').slice(0, 7) === MONTH).length;
      const tgt = r.monthlyTarget || 0;
      const sales = orders
        .filter((o) => (o as any).repId === r.repId || (o as any).rep === r.name)
        .filter((o) => String(o.date || o.createdAt || '').slice(0, 7) === MONTH)
        .reduce((s, o) => s + (o.grand || 0), 0);
      return {
        rep: r,
        customers: mine.length,
        added,
        target: tgt,
        pct: tgt ? Math.round((added / tgt) * 100) : 0,
        sales,
        present: attendance.some((a) => a.repId === r.repId && a.date === TODAY && a.status === 'present'),
        daysPresent: attendance.filter((a) => a.repId === r.repId && a.status === 'present').length,
        visiting: openVisits.find((v) => v.rep === r.repId),
      };
    });
  }, [reps, customers, orders, attendance, openVisits]);

  const openEdit = (r: Rep) => {
    setEditing(r);
    setPct(String(r.commissionPct ?? ''));
    setTarget(String(r.monthlyTarget ?? ''));
  };

  const save = async () => {
    if (!editing) return;
    const p = parseFloat(pct);
    const t = parseInt(target, 10);
    if (isNaN(p) || p < 0 || p > 100) { Alert.alert('Commission must be between 0 and 100'); return; }
    if (isNaN(t) || t < 50) { Alert.alert('Monthly target must be at least 50'); return; }
    setBusy(true);
    try {
      await api.saveRep(editing.repId, { commissionPct: p, monthlyTarget: t });
      setEditing(null);
      load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Team"
        sub={reps ? `${presentToday.length}/${reps.length} present today · ${openVisits.length} out on a visit` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : reps === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <View style={styles.kpis}>
            <Kpi label="Present today" value={`${presentToday.length} / ${reps.length}`} sub={MONTH_NAME} />
            <Kpi label="Out on a visit" value={openVisits.length} sub={`${todaysVisits.length} visits today`} />
          </View>

          <Text style={styles.sec}>Reps</Text>
          <Text style={styles.secMeta}>attendance, target and commission</Text>
          {rows.map((x) => (
            <View key={x.rep.repId} style={styles.card}>
              <View style={styles.head}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{x.rep.name}</Text>
                  <Text style={styles.meta}>{[x.rep.repId, x.rep.region].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={[styles.pill, x.present
                  ? { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk }
                  : { backgroundColor: theme.rubySoft, color: theme.ruby }]}>
                  {x.present ? 'Present' : 'Not marked'}
                </Text>
              </View>

              {!!x.visiting && (
                <Text style={styles.visiting}>
                  ● Visiting {x.visiting.custName || 'a customer'} since {at(x.visiting.checkIn)}
                </Text>
              )}

              <View style={styles.statRow}>
                <Stat label="Customers" value={String(x.customers)} />
                <Stat label="New adds" value={x.target ? `${x.added}/${x.target}` : String(x.added)}
                      tone={x.target && x.pct < 60 ? 'warn' : undefined} />
                <Stat label="Sales MTD" value={money(x.sales)} />
                <Stat label="Days present" value={String(x.daysPresent)} />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.btn} onPress={() => openEdit(x.rep)}>
                  <Text style={styles.btnTxt}>Commission &amp; target</Text>
                </TouchableOpacity>
                {!!x.rep.phone && (
                  <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(`tel:+91${x.rep.phone}`)}>
                    <Text style={styles.ghostTxt}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.rate}>
                {x.rep.commissionPct ?? 0}% commission · target {x.rep.monthlyTarget ?? 0} new customers a month
              </Text>
            </View>
          ))}

          {/* The visit detail lives on its own Field Visits section — day
              picker, per-rep time in field, live durations. Duplicating a
              cut-down copy here would only go stale against it. */}
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Visits')}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name}>Field Visits</Text>
              <Text style={styles.meta}>
                {todaysVisits.length} today · {openVisits.length} in progress — where each rep went and for how long
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{editing?.name}</Text>
              <TouchableOpacity onPress={() => setEditing(null)}><Text style={styles.close}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.label}>COMMISSION %</Text>
            <TextInput
              style={styles.ipt}
              value={pct}
              onChangeText={(v) => setPct(v.replace(/[^\d.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="4"
              placeholderTextColor={theme.meta}
            />

            <Text style={styles.label}>MONTHLY NEW-CUSTOMER TARGET</Text>
            <TextInput
              style={styles.ipt}
              value={target}
              onChangeText={(v) => setTarget(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="50"
              placeholderTextColor={theme.meta}
            />
            <Text style={styles.note}>The server holds the target to a minimum of 50.</Text>

            <TouchableOpacity style={[styles.save, busy && { opacity: 0.55 }]} onPress={save} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!sub && <Text style={styles.meta}>{sub}</Text>}
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'warn' && { color: theme.ruby }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  kpis: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 },
  kpiLabel: { fontSize: 11, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 4 },

  sec: { fontSize: 14, fontWeight: '800', color: theme.ink, marginTop: 26 },
  secMeta: { fontSize: 12, color: theme.meta, marginTop: 2, marginBottom: 10 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  meta: { fontSize: 12, color: theme.meta, marginTop: 3 },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
    overflow: 'hidden', flexShrink: 0,
  },
  visiting: { fontSize: 12.5, fontWeight: '700', color: theme.emeraldInk, marginTop: 8 },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stat: { minWidth: '22%' },
  statLabel: { fontSize: 10, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  statValue: { fontSize: 14, fontWeight: '800', color: theme.ink, marginTop: 2 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  btnTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9, flexShrink: 0,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12.5, fontWeight: '700' },
  rate: { fontSize: 11.5, color: theme.meta, marginTop: 10 },

  linkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 14,
  },
  chev: { fontSize: 22, color: theme.meta, flexShrink: 0 },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.ink },
  close: { fontSize: 18, color: theme.meta, paddingHorizontal: 6 },
  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: theme.ink,
  },
  note: { fontSize: 11.5, color: theme.meta, marginTop: 8 },
  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },

  empty: { fontSize: 13, color: theme.meta, paddingVertical: 14 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
