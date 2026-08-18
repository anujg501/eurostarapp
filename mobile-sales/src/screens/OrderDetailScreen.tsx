import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type Order } from '../api';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TRADE_DESK = '917710065480';

// The wording the shop uses for each state — STATUS_META in docs/app/data.jsx.
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending:   { label: 'Awaiting confirmation', bg: '#FCEBC8', fg: '#8A6314' },
  confirmed: { label: 'Confirmed',             bg: '#E7EEF7', fg: '#1F3350' },
  packed:    { label: 'Packed',                bg: '#E7EEF7', fg: '#1F3350' },
  shipped:   { label: 'In transit',            bg: theme.emeraldSoft, fg: theme.emeraldInk },
  delivered: { label: 'Delivered',             bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { label: 'Cancelled',             bg: theme.rubySoft,    fg: theme.ruby },
};

const STAGES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

const when = (raw?: string) => {
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * One order, and where it has got to.
 *
 * The tracking rail is the website's: five stages, everything up to the order's
 * own status filled in, the stage it sits at now marked, the rest still ahead.
 */
export default function OrderDetailScreen({ navigation, route }: any) {
  const { id } = route.params as { id: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      setOrder(await api.order(id));
    } catch (e: any) {
      setErr(e?.message || 'Could not load this order.');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const st = order ? STATUS[order.status] || STATUS.pending : STATUS.pending;
  const at = order ? STAGES.indexOf(order.status) : -1;
  const lines = order?.items || [];
  const pcs = lines.reduce((a, l) => a + (l.qty || 0), 0);
  const skus = lines.length;

  const stages = [
    { label: 'Order placed', meta: when(order?.date || order?.createdAt) },
    { label: 'Confirmed by Eurostar', meta: 'Within 24h' },
    { label: 'Packed & sealed', meta: 'Mumbai warehouse' },
    { label: 'In transit', meta: order?.isExport ? 'DHL Export' : 'Insured domestic courier' },
    { label: 'Delivered', meta: order?.dispatchBy ? `Expected ${order.dispatchBy}` : '' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Orders" />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : !order ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={15} color={theme.ink} />
            <Text style={styles.backTxt}>Your orders</Text>
          </TouchableOpacity>

          <Text style={styles.h1}>Order on {when(order.date || order.createdAt) || order.id}</Text>
          <View style={styles.pillRow}>
            <Text style={[styles.pill, { backgroundColor: st.bg, color: st.fg }]}>{st.label}</Text>
            <Text style={styles.orderNo}>{order.id}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.kicker}>
              LINE ITEMS · {skus} SKU{skus === 1 ? '' : 'S'} · {pcs.toLocaleString('en-IN')} PCS
            </Text>
            {lines.map((l, i) => (
              <View key={i} style={[styles.line, i > 0 && styles.lineSep]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {[l.colour, l.shape].filter(Boolean).join(' ') || l.pid || 'Item'}
                  </Text>
                  <Text style={styles.meta}>
                    {[l.size, `${l.qty ?? 0} ${l.unit || 'pkt'}`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={styles.lineAmt}>{money(l.lineTotal ?? (l.unitPrice || 0) * (l.qty || 0))}</Text>
              </View>
            ))}
            {!lines.length && <Text style={styles.meta}>The office holds the item list for this order.</Text>}
          </View>

          {/* Tracking */}
          <View style={styles.card}>
            <Text style={[styles.kicker, { marginBottom: 4 }]}>TRACKING</Text>
            {stages.map((s, i) => {
              const done = at >= 0 && i <= at;
              const current = i === at;
              return (
                <View key={s.label} style={styles.step}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, done && styles.dotDone, current && styles.dotNow]} />
                    {i < stages.length - 1 && <View style={[styles.stalk, done && styles.stalkDone]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 18 }}>
                    <Text style={[styles.stepTitle, done && styles.stepTitleOn]}>{s.label}</Text>
                    {!!s.meta && <Text style={styles.meta}>{s.meta}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Invoice summary */}
          <View style={styles.card}>
            <Text style={[styles.kicker, { marginBottom: 12 }]}>INVOICE SUMMARY</Text>
            <Row label={`Subtotal · ${pcs.toLocaleString('en-IN')} pcs`} value={money(order.subtotal)} />
            <Row label={order.isExport ? 'IGST · export' : 'GST · 3%'} value={money(order.tax)} />
            <Row label="Shipping & insurance" value={money((order.shipping || 0) + (order.insurance || 0))} />
            <View style={styles.rule} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLbl}>Total payable</Text>
              <Text style={styles.totalVal}>{money(order.grand)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[styles.kicker, { marginBottom: 8 }]}>SHIPPING TO</Text>
            <Text style={styles.shipName}>{order.customer || '—'}</Text>
            {!!order.city && <Text style={styles.meta}>{order.city}</Text>}
            {!!order.code && <Text style={styles.meta}>Account {order.code}</Text>}
          </View>

          <TouchableOpacity
            style={styles.ghost}
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${TRADE_DESK}?text=${encodeURIComponent(`Hello — about order ${order.id}`)}`
              ).catch(() => {})
            }
          >
            <Feather name="message-circle" size={15} color={theme.ink} />
            <Text style={styles.ghostTxt}>Message trade desk</Text>
          </TouchableOpacity>

          <ShopFooter />
        </ScrollView>
      )}

      <Mira role="customer" section="Order detail" />
    </View>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.sumRow}>
    <Text style={styles.sumLbl}>{label}</Text>
    <Text style={styles.sumVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  backTxt: { fontSize: 13.5, fontWeight: '600', color: theme.ink },

  h1: { fontFamily: 'serif', fontSize: 28, color: theme.ink, letterSpacing: -0.3 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 16 },
  pill: {
    fontSize: 11.5, fontWeight: '700', borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 5, overflow: 'hidden',
  },
  orderNo: { fontFamily: 'monospace', fontSize: 12.5, color: theme.meta },

  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  kicker: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 3 },

  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 12 },
  lineSep: { borderTopWidth: 1, borderTopColor: theme.divider, marginTop: 12 },
  lineName: { fontSize: 14, fontWeight: '600', color: theme.ink, textTransform: 'capitalize' },
  lineAmt: { fontSize: 14.5, fontWeight: '800', color: theme.ink },

  // Tracking rail: a filled dot for what has happened, emerald for where it is.
  step: { flexDirection: 'row', gap: 14, marginTop: 14 },
  rail: { alignItems: 'center', width: 18 },
  dot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    borderColor: theme.border, backgroundColor: theme.surface,
  },
  dotDone: { backgroundColor: theme.ink, borderColor: theme.ink },
  dotNow: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  stalk: { flex: 1, width: 2, backgroundColor: theme.divider, marginTop: 2 },
  stalkDone: { backgroundColor: theme.ink },
  stepTitle: { fontSize: 14, fontWeight: '600', color: theme.meta },
  stepTitleOn: { color: theme.ink, fontWeight: '700' },

  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLbl: { fontSize: 13, color: theme.meta },
  sumVal: { fontSize: 13, fontWeight: '600', color: theme.ink },
  rule: { height: 1, backgroundColor: theme.divider, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLbl: { fontSize: 15, fontWeight: '700', color: theme.ink },
  totalVal: { fontFamily: 'serif', fontSize: 23, color: theme.ink },

  shipName: { fontSize: 14.5, fontWeight: '700', color: theme.ink },

  ghost: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
    borderRadius: 10, paddingVertical: 14, marginTop: 4,
  },
  ghostTxt: { fontSize: 14, fontWeight: '700', color: theme.ink },

  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
