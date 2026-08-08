import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Customer, type Order, type Rfq, type StaffRole } from '../api';
import { theme } from '../theme';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

// The desk: what this person is responsible for today. The server already
// scopes the lists by the signed-in token — a rep gets their own customers,
// office and admin get everything — so this screen just counts what came back
// rather than deciding who may see what.
export default function DeskScreen({ navigation, role, onSignOut }: any) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null);
  const [who, setWho] = useState<string>('');
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const [me, c, o] = await Promise.all([
        api.me().catch(() => null),
        api.customers().catch(() => []),
        api.orders().catch(() => []),
      ]);
      if (me) setWho(me.name + (me.repId ? ` · ${me.repId}` : ''));
      setCustomers(Array.isArray(c) ? c : []);
      setOrders(Array.isArray(o) ? o : []);
      // Enquiries are a separate concern: if this one call fails the rest of
      // the desk should still render.
      setRfqs(await api.rfqs().catch(() => []));
    } catch (e: any) {
      setErr(e?.message || 'Could not load your desk.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const loading = customers === null || orders === null;
  const pending = (orders || []).filter((o) => o.status === 'pending').length;
  const openRfq = (rfqs || []).filter((r) => r.status === 'open').length;
  const value = (orders || []).reduce((s, o) => s + (o.grand || 0), 0);

  const roleLabel: Record<StaffRole, string> = { rep: 'Sales Rep', admin: 'Administration', office: 'Back Office' };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My desk</Text>
            <Text style={styles.sub}>{roleLabel[role as StaffRole] || role}{who ? ` · ${who}` : ''}</Text>
          </View>
          <TouchableOpacity style={styles.out} onPress={onSignOut}>
            <Text style={styles.outTxt}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
            <View style={styles.kpis}>
              <Kpi label="Customers" value={customers!.length} />
              <Kpi label="Orders" value={orders!.length} sub={pending ? `${pending} pending` : 'none pending'} />
              <Kpi label="Open enquiries" value={openRfq} />
              <Kpi label="Order value" value={money(value)} wide />
            </View>

            <Text style={styles.sec}>Go to</Text>
            <Row label="Customers" meta={`${customers!.length} on your book`} onPress={() => navigation.navigate('Customers')} />
            <Row label="Orders" meta={pending ? `${pending} waiting to be confirmed` : 'all confirmed'} onPress={() => navigation.navigate('Orders')} />

            <Text style={styles.sec}>Recent orders</Text>
            {orders!.slice(0, 5).map((o) => (
              <View key={o.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineTitle}>{o.custName || o.customerName || o.customer || 'Customer'}</Text>
                  <Text style={styles.lineMeta}>{o.id} · {o.status}</Text>
                </View>
                <Text style={styles.amount}>{money(o.grand)}</Text>
              </View>
            ))}
            {!orders!.length && <Text style={styles.empty}>No orders yet.</Text>}
          </>
        )}
      </ScrollView>
    </View>
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

function Row({ label, meta, onPress }: { label: string; meta: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  out: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 },
  outTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2 },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  err: { backgroundColor: theme.rubySoft, borderWidth: 1, borderColor: '#E6C9C9', borderRadius: 12, padding: 12, marginBottom: 14 },
  errTxt: { color: theme.ruby, fontSize: 13 },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: {
    width: '47%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 14,
  },
  kpiLabel: { fontSize: 11.5, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.6 },
  kpiValue: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 4 },
  kpiSub: { fontSize: 11.5, color: theme.meta, marginTop: 2 },

  sec: { fontSize: 13, fontWeight: '800', color: theme.ink, marginTop: 24, marginBottom: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: theme.ink },
  rowMeta: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  chev: { fontSize: 22, color: theme.meta, flexShrink: 0 },

  line: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  lineTitle: { fontSize: 14, fontWeight: '600', color: theme.ink },
  lineMeta: { fontSize: 12, color: theme.meta, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700', color: theme.emeraldInk, flexShrink: 0 },
  empty: { fontSize: 13, color: theme.meta, paddingVertical: 10 },
});
