import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Linking, TouchableOpacity } from 'react-native';
import { api, slabCommission, type Order, type Payment } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const MONTH = new Date().toISOString().slice(0, 7);

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: theme.amberSoft, fg: theme.amber },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  packed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  shipped: { bg: '#E7EEF7', fg: '#1F3350' },
  delivered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { bg: theme.rubySoft, fg: theme.ruby },
};

/**
 * My commission — the desktop screen, slab for slab.
 *
 * The rate is not a single percentage: each band pays its own rate on the sales
 * that fall inside it, so the blended rate climbs through the month. The table
 * shows the working, because a rep who cannot see how the number was reached
 * has no way to check it.
 */
export default function CommissionScreen({ navigation, active = true }: any) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!active) return;
    Promise.all([api.orders().catch(() => []), api.payments().catch(() => [])])
      .then(([o, p]) => {
        setOrders(Array.isArray(o) ? o : []);
        setPayments(Array.isArray(p) ? p : []);
      })
      .catch((e) => { setErr(e?.message || 'Could not load your commission.'); setOrders([]); });
  }, [active]);

  const mtd = useMemo(
    () => (orders || []).filter((o) => String(o.date || o.createdAt || '').slice(0, 7) === MONTH),
    [orders]
  );
  const sales = mtd.reduce((s, o) => s + (o.grand || 0), 0);
  const comm = useMemo(() => slabCommission(sales), [sales]);
  const allSales = (orders || []).reduce((s, o) => s + (o.grand || 0), 0);
  const dispatched = (orders || []).filter((o) => ['shipped', 'delivered'].includes(o.status));
  const payFor = (id: string) => payments.find((p) => p.orderId === id && p.status !== 'failed');

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead title="My commission" sub="slab-based on your monthly sales" onBack={() => navigation.goBack()} />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : orders === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <View style={styles.kpis}>
            <Kpi label="Sales (MTD)" value={money(sales)} />
            <Kpi label="Blended rate" value={`${(comm.effectiveRate * 100).toFixed(2)}%`} />
            <Kpi label="Earned (MTD)" value={money(comm.total)} accent wide />
          </View>

          <Text style={styles.sec}>How your commission is worked out</Text>
          <Text style={styles.secMeta}>higher slabs pay more</Text>
          <View style={styles.card}>
            {comm.breakdown.map((s, i) => (
              <View key={i} style={[styles.slab, i > 0 && styles.sep]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.slabBand}>
                    {s.to == null ? `${money(s.from)} and above` : `${money(s.from)} – ${money(s.to)}`}
                  </Text>
                  <Text style={styles.slabMeta}>{s.pct}% · {money(s.amount)} of your sales in this slab</Text>
                </View>
                <Text style={[styles.slabComm, s.comm > 0 && { color: theme.emeraldInk }]}>{money(s.comm)}</Text>
              </View>
            ))}
            <View style={[styles.slab, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total commission (MTD)</Text>
              <Text style={styles.totalValue}>{money(comm.total)}</Text>
            </View>
          </View>
          <Text style={styles.note}>
            Only confirmed, paid orders count. Log every payment so your sales are counted here.
          </Text>

          <Text style={styles.sec}>All orders</Text>
          <Text style={styles.secMeta}>full order history</Text>
          <View style={styles.card}>
            {(orders || []).length === 0 && <Text style={styles.empty}>No orders yet.</Text>}
            {(orders || []).map((o, i) => {
              const tone = STATUS_TONE[o.status] || { bg: theme.card, fg: theme.ink2 };
              const pay = payFor(o.id);
              return (
                <View key={o.id} style={[styles.row, i > 0 && styles.sep]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {o.custName || o.customerName || o.customer || 'Customer'}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {o.id}{o.date || o.createdAt ? ` · ${String(o.date || o.createdAt).slice(0, 10)}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexShrink: 0, gap: 4 }}>
                    <Text style={styles.amount}>{money(o.grand)}</Text>
                    <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>
                      {pay?.status === 'confirmed' ? '✓ Paid' : pay?.status === 'pending' ? 'Pending' : o.status}
                    </Text>
                  </View>
                </View>
              );
            })}
            {(orders || []).length > 0 && (
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total sales</Text>
                <Text style={styles.totalValue}>{money(allSales)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sec}>Dispatch &amp; courier slips</Text>
          <Text style={styles.secMeta}>your customers' shipments only</Text>
          <View style={styles.card}>
            {dispatched.length === 0 ? (
              <Text style={styles.empty}>No dispatched orders yet.</Text>
            ) : (
              dispatched.map((o, i) => (
                <View key={o.id} style={[styles.row, i > 0 && styles.sep]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {o.custName || o.customerName || o.customer || 'Customer'}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {o.id} · {o.status}
                      {(o as any).courier ? ` · ${(o as any).courier}` : ''}
                      {(o as any).track ? ` · ${(o as any).track}` : ''}
                    </Text>
                  </View>
                  {(o as any).slip ? (
                    <TouchableOpacity onPress={() => Linking.openURL((o as any).slip)}>
                      <Image source={{ uri: (o as any).slip }} style={styles.slip} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.rowMeta}>No slip</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Kpi({ label, value, accent, wide }: { label: string; value: string; accent?: boolean; wide?: boolean }) {
  return (
    <View style={[styles.kpi, wide && { width: '100%' }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, accent && { color: theme.emeraldInk }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: {
    width: '47.5%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 14,
  },
  kpiLabel: { fontSize: 11, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  kpiValue: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 4 },

  sec: { fontSize: 14, fontWeight: '800', color: theme.ink, marginTop: 26 },
  secMeta: { fontSize: 12, color: theme.meta, marginTop: 2, marginBottom: 10 },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 14 },
  sep: { borderTopWidth: 1, borderTopColor: theme.divider },

  slab: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  slabBand: { fontSize: 13.5, fontWeight: '700', color: theme.ink },
  slabMeta: { fontSize: 12, color: theme.meta, marginTop: 2 },
  slabComm: { fontSize: 15, fontWeight: '800', color: theme.meta, flexShrink: 0 },

  totalRow: { borderTopWidth: 2, borderTopColor: theme.divider },
  totalLabel: { flex: 1, fontSize: 13.5, fontWeight: '700', color: theme.ink },
  totalValue: { fontSize: 16, fontWeight: '800', color: theme.emeraldInk, flexShrink: 0 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: theme.ink },
  rowMeta: { fontSize: 12, color: theme.meta, marginTop: 2 },
  amount: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    overflow: 'hidden', textTransform: 'capitalize',
  },
  slip: { width: 54, height: 40, borderRadius: 5, borderWidth: 1, borderColor: theme.border },

  note: { fontSize: 12.5, color: theme.meta, marginTop: 10, lineHeight: 18 },
  empty: { fontSize: 13, color: theme.meta, paddingVertical: 14 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
