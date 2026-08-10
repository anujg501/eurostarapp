import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import {
  api, nextStatus, ORDER_LABEL, ORDER_FLOW,
  type Order, type Cart, type Rfq, type OrderStatus,
} from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

// Colour tells the state at a glance, the way the web CRM's pills do.
const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: theme.amberSoft, fg: theme.amber },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  packed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  shipped: { bg: '#E7EEF7', fg: '#1F3350' },
  dispatched: { bg: '#E7EEF7', fg: '#1F3350' },
  'out-for-delivery': { bg: '#E7EEF7', fg: '#1F3350' },
  delivered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { bg: theme.rubySoft, fg: theme.ruby },
  returned: { bg: theme.rubySoft, fg: theme.ruby },
  refunded: { bg: theme.rubySoft, fg: theme.ruby },
};

const CLOSED = ['delivered', 'cancelled', 'returned', 'refunded', 'rejected'];

/**
 * The order desk.
 *
 * For the back office this is the job, not a report: every order that is not
 * yet delivered sits in a queue and gets walked New → Confirmed → Packed →
 * Shipped → Out for delivery → Delivered, with the courier attached when it
 * ships. A rep opening the same screen just sees their own orders — the server
 * scopes the list, and the pipeline controls are the office's.
 *
 * Delivered orders do not vanish; they fold away below and can be reopened,
 * because "Delivered" gets tapped by mistake and shipments do come back.
 */
export default function OrdersScreen({ navigation, role = 'rep', active = true, onCounts }: any) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<'queue' | 'all' | OrderStatus>('queue');
  const [busy, setBusy] = useState<string | null>(null);
  const [shipping, setShipping] = useState<Order | null>(null);
  const [courier, setCourier] = useState('');
  const [track, setTrack] = useState('');

  const office = role !== 'rep';

  const load = () => {
    api.orders()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setErr(e?.message || 'Could not load orders.'); setRows([]); });
    if (office) {
      api.carts().then((c) => setCarts(Array.isArray(c) ? c : [])).catch(() => {});
      api.rfqs().then((q) => setRfqs(Array.isArray(q) ? q : [])).catch(() => {});
    }
  };

  useEffect(() => { if (active) load(); }, [active]);

  const queue = (rows || []).filter((o) => !CLOSED.includes(o.status));
  const closed = (rows || []).filter((o) => CLOSED.includes(o.status));
  const pending = (rows || []).filter((o) => o.status === 'pending').length;
  useEffect(() => { if (rows) onCounts?.({ Orders: pending }); }, [onCounts, rows, pending]);

  const list = useMemo(() => {
    if (filter === 'queue') return queue;
    if (filter === 'all') return rows || [];
    return (rows || []).filter((o) => o.status === filter);
  }, [rows, filter, queue]);

  const value = list.reduce((s, o) => s + (o.grand || 0), 0);

  const when = (o: Order) => {
    const raw = o.date || o.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    // A missing or unparseable date must never print "Invalid Date" at staff.
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const move = async (o: Order, status: OrderStatus, extra?: { courier?: string; track?: string }) => {
    setBusy(o.id);
    try {
      await api.updateOrder(o.id, { status, ...extra });
      load();
    } catch (e: any) {
      Alert.alert('Could not move that order', e?.message || 'Please try again.');
    } finally { setBusy(null); }
  };

  const advance = (o: Order) => {
    const next = nextStatus(o.status);
    if (!next) return;
    // Shipping is where the courier gets attached, so ask for it then.
    if (next === 'shipped') { setShipping(o); setCourier(o.courier || ''); setTrack(o.track || ''); return; }
    Alert.alert(
      `Mark ${ORDER_LABEL[next]}?`,
      `${o.id} · ${o.custName || o.customerName || o.customer || 'Customer'} · ${money(o.grand)}`,
      [{ text: 'Cancel', style: 'cancel' }, { text: ORDER_LABEL[next], onPress: () => move(o, next) }]
    );
  };

  const ship = () => {
    if (!shipping) return;
    const o = shipping;
    setShipping(null);
    move(o, 'shipped', { courier: courier.trim() || undefined, track: track.trim() || undefined });
  };

  const reopen = (o: Order) => {
    Alert.alert(
      'Reopen this order?',
      `${o.id} goes back to Shipped so it can be corrected or re-delivered.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Reopen', onPress: () => move(o, 'shipped') }]
    );
  };

  const cancel = (o: Order) => {
    Alert.alert(
      'Cancel this order?',
      `${o.id} will be marked cancelled. This is visible to the customer.`,
      [{ text: 'Keep it', style: 'cancel' }, { text: 'Cancel order', style: 'destructive', onPress: () => move(o, 'cancelled') }]
    );
  };

  const FILTERS: { k: 'queue' | 'all' | OrderStatus; label: string }[] = office
    ? [
        { k: 'queue', label: `To dispatch (${queue.length})` },
        { k: 'pending', label: `New (${pending})` },
        { k: 'delivered', label: `Delivered (${closed.filter((o) => o.status === 'delivered').length})` },
        { k: 'all', label: `All (${(rows || []).length})` },
      ]
    : [
        { k: 'all', label: 'All' },
        { k: 'pending', label: 'New' },
        { k: 'shipped', label: 'Shipped' },
        { k: 'delivered', label: 'Delivered' },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title={office ? 'Order desk' : 'Orders'}
        sub={rows ? `${list.length} shown · ${money(value)}` : 'loading…'}
      />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {office && (
                <View style={styles.kpis}>
                  <Kpi label="To review / dispatch" value={queue.length} sub={`${pending} new`} />
                  <Kpi label="Quote requests" value={carts.filter((c) => c.status === 'quote-requested').length}
                       sub="awaiting price approval" />
                  <Kpi label="Abandoned carts" value={carts.filter((c) => c.status === 'abandoned').length}
                       sub="to recover" />
                  <Kpi label="Open RFQs" value={rfqs.filter((q) => q.status === 'open').length}
                       sub="custom-quote requests" />
                </View>
              )}

              <View style={styles.chips}>
                {FILTERS.map((f) => {
                  const on = filter === f.k;
                  return (
                    <TouchableOpacity key={String(f.k)} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f.k)}>
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {office && filter === 'queue' && (
                <Text style={styles.flowNote}>New → Confirmed → Packed → Shipped → Out for delivery → Delivered</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'queue'
                ? 'Nothing to dispatch — every order is delivered or closed. 🎉'
                : 'No orders here.'}
            </Text>
          }
          renderItem={({ item }) => {
            const tone = TONE[item.status] || { bg: theme.card, fg: theme.ink2 };
            const next = nextStatus(item.status);
            const working = busy === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.id}>{item.id}</Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>
                    {ORDER_LABEL[item.status] || item.status}
                  </Text>
                </View>
                <Text style={styles.cust} numberOfLines={1}>
                  {item.custName || item.customerName || item.customer || 'Customer'}
                </Text>
                <Text style={styles.meta}>
                  {[when(item), item.rep, item.paid ? 'PAID' : null].filter(Boolean).join(' · ')}
                </Text>
                {!!item.courier && (
                  <Text style={styles.meta}>🚚 {item.courier}{item.track ? ` · ${item.track}` : ''}</Text>
                )}

                <View style={styles.cardFoot}>
                  <Text style={styles.amount}>{money(item.grand)}</Text>
                </View>

                {office && (
                  <View style={styles.actions}>
                    {!!next && (
                      <TouchableOpacity
                        style={[styles.btn, working && { opacity: 0.5 }]}
                        disabled={working}
                        onPress={() => advance(item)}
                      >
                        <Text style={styles.btnTxt}>{working ? 'Saving…' : `Mark ${ORDER_LABEL[next]} →`}</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'delivered' && (
                      <TouchableOpacity style={styles.ghost} disabled={working} onPress={() => reopen(item)}>
                        <Text style={styles.ghostTxt}>Reopen</Text>
                      </TouchableOpacity>
                    )}
                    {!CLOSED.includes(item.status) && (
                      <TouchableOpacity style={styles.ghost} disabled={working} onPress={() => cancel(item)}>
                        <Text style={[styles.ghostTxt, { color: theme.ruby }]}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Shipping is the one step that carries information with it. */}
      <Modal visible={!!shipping} transparent animationType="slide" onRequestClose={() => setShipping(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Ship {shipping?.id}</Text>
              <TouchableOpacity onPress={() => setShipping(null)}><Text style={styles.close}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              {shipping?.custName || shipping?.customerName || 'Customer'} · {money(shipping?.grand)}
            </Text>

            <Text style={styles.label}>COURIER</Text>
            <TextInput style={styles.ipt} value={courier} onChangeText={setCourier}
              placeholder="DHL / Blue Dart / hand delivery" placeholderTextColor={theme.meta} />

            <Text style={styles.label}>TRACKING NUMBER</Text>
            <TextInput style={styles.ipt} value={track} onChangeText={setTrack}
              placeholder="Optional" placeholderTextColor={theme.meta} autoCapitalize="characters" />

            <TouchableOpacity style={styles.save} onPress={ship}>
              <Text style={styles.saveTxt}>Mark shipped</Text>
            </TouchableOpacity>
            <Text style={styles.note}>The customer sees the courier and tracking on their order.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  kpi: {
    width: '47.5%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 12,
  },
  kpiLabel: { fontSize: 10.5, color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 3 },
  kpiSub: { fontSize: 11, color: theme.meta, marginTop: 2 },

  chips: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 16 },
  chip: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.surface,
  },
  chipOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  chipTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  flowNote: { fontSize: 11.5, color: theme.meta, marginTop: 12 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginTop: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  id: { flex: 1, fontSize: 13.5, fontWeight: '700', color: theme.ink, fontFamily: 'monospace' },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
    overflow: 'hidden', flexShrink: 0,
  },
  cust: { fontSize: 14.5, fontWeight: '600', color: theme.ink, marginTop: 7 },
  meta: { fontSize: 12, color: theme.meta, marginTop: 3 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  amount: { fontSize: 16, fontWeight: '800', color: theme.emeraldInk },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  btnTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12.5, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.ink },
  sheetSub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  close: { fontSize: 18, color: theme.meta, paddingHorizontal: 6 },
  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: theme.ink,
  },
  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  note: { fontSize: 11.5, color: theme.meta, marginTop: 10, textAlign: 'center' },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, paddingHorizontal: 24, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
