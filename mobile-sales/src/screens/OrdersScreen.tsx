import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type Order } from '../api';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FCEBC8', fg: '#8A6314' },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  packed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  shipped: { bg: '#E7EEF7', fg: '#1F3350' },
  delivered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { bg: theme.rubySoft, fg: theme.ruby },
};

const CLOSED = ['delivered', 'cancelled', 'returned', 'refunded'];
type Tab = 'Cart' | 'Active' | 'Delivered';

/**
 * Your orders — what is in the basket, what is on its way, and what has landed.
 *
 * The server scopes both lists to the signed-in account, so nothing is filtered
 * by the app; the counts are simply what came back.
 */
export default function OrdersScreen({ navigation }: any) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [carts, setCarts] = useState<any[]>([]);
  const [who, setWho] = useState('');
  const [terms, setTerms] = useState('');
  const [err, setErr] = useState('');
  // A cart edit is in flight — the steppers lock so two taps cannot race and
  // save stale lines over each other.
  const [busy, setBusy] = useState(false);
  // Until the customer picks a tab, open on whichever the website would:
  // the cart when something is waiting in it, otherwise the active orders.
  const [picked, setTab] = useState<Tab | null>(null);

  const load = useCallback(async () => {
    try {
      const [me, o, c] = await Promise.all([
        api.me().catch(() => null),
        api.orders(),
        api.carts().catch(() => [] as any[]),
      ]);
      if (me) setWho(me.name || '');
      setRows(Array.isArray(o) ? o : []);
      setCarts(Array.isArray(c) ? c.filter((x) => x.status === 'active') : []);
      // The account line shows the payment terms, as the website does.
      const phone = me?.phone || '';
      if (phone) {
        const cust = await api.customerByPhone(phone).catch(() => null);
        if (cust?.terms) setTerms(cust.terms === 'cash' ? 'Cash account' : `NET ${cust.terms} account`);
      }
    } catch (e: any) {
      setErr(e?.message || 'Could not load your orders.');
      setRows([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The server stores the cart, so an edit is a save rather than local state.
  // The lines it sends back carry an `id` the write schema does not accept, and
  // lineTotal is the server's own arithmetic — both are dropped here.
  const linesToSave = (cart: any, keep: (l: any) => boolean, patch?: (l: any) => any) =>
    (cart.lines || []).filter(keep).map((l: any) => {
      const { skuId, name, categoryKey, grade, colour, shape, size, unit, qty, unitPrice } = patch ? patch(l) : l;
      return { skuId, name, categoryKey, grade, colour, shape, size, unit, qty, unitPrice };
    });

  const applyCart = async (cartId: string, next: any[]) => {
    setBusy(true);
    try {
      // A cart with nothing left in it is deleted, not saved empty — an empty
      // basket should disappear rather than sit on the office's list.
      if (next.length === 0) await api.deleteCart(cartId);
      else await api.saveCartLines(cartId, next as any);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Could not update the cart.');
    } finally {
      setBusy(false);
    }
  };

  const removeLine = (line: any) => {
    const cart = carts.find((c) => c.id === line.cartId);
    if (!cart) return;
    applyCart(cart.id, linesToSave(cart, (l) => l.id !== line.id));
  };

  const setQty = (line: any, qty: number) => {
    const cart = carts.find((c) => c.id === line.cartId);
    if (!cart || qty < 1) return;
    applyCart(cart.id, linesToSave(cart, () => true, (l) => (l.id === line.id ? { ...l, qty } : l)));
  };

  const active = (rows || []).filter((o) => !CLOSED.includes(o.status));
  const delivered = (rows || []).filter((o) => o.status === 'delivered');
  const cartLines = useMemo(
    () => carts.reduce((a, c) => a + (c.lines?.length || 0), 0),
    [carts]
  );
  const cartValue = useMemo(
    () => carts.reduce((a, c) => a + (c.totals?.grand || 0), 0),
    [carts]
  );

  const when = (o: Order) => {
    const raw = o.date || o.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    // Never print "Invalid Date" at a customer.
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const tab: Tab = picked ?? (cartLines ? 'Cart' : 'Active');
  const shown = tab === 'Active' ? active : tab === 'Delivered' ? delivered : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Orders" who={who} />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <Text style={styles.crumb}>ORDERS</Text>
          <Text style={styles.h1}>Your orders</Text>
          <Text style={styles.sub}>{[who, 'Account', terms].filter(Boolean).join(' · ')}</Text>

          <Kpi label="ACTIVE ORDERS" value={String(active.length)} />
          <Kpi
            label="IN CART"
            value={`${cartLines} line${cartLines === 1 ? '' : 's'}`}
            sub={cartValue ? money(cartValue) : '—'}
          />
          <Kpi label="LIFETIME ORDERS" value={String((rows || []).length)} />

          <View style={styles.tabs}>
            {(['Cart', 'Active', 'Delivered'] as Tab[]).map((t) => {
              const n = t === 'Cart' ? cartLines : t === 'Active' ? active.length : delivered.length;
              const on = tab === t;
              return (
                <TouchableOpacity key={t} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t)}>
                  {t === 'Cart' && <Feather name="shopping-bag" size={13} color={on ? theme.ink : theme.meta} />}
                  <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{t}</Text>
                  <Text style={styles.tabCount}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === 'Cart' ? (
            cartLines === 0 ? (
              <Empty
                icon="shopping-bag"
                title="Your cart is empty"
                body="Sizes you add while browsing wait here until you place the order."
                cta="Browse categories"
                onPress={() => navigation.navigate('Home')}
              />
            ) : (
              <View style={styles.card}>
                {carts.flatMap((c) => (c.lines || []).map((l: any) => ({ ...l, cartId: c.id })))
                  .map((l: any, i: number) => (
                  <View key={l.id || i} style={[styles.line, { alignItems: 'flex-start' }, i > 0 && styles.lineSep]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.lineName} numberOfLines={2}>{l.name || 'Item'}</Text>
                      <Text style={styles.lineMeta}>
                        {[l.size, l.shape].filter(Boolean).join(' · ')}
                      </Text>

                      {/* Change how many, or drop the line — the same two
                          controls the website's cart puts on every row. */}
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={[styles.step, (busy || l.qty <= 1) && styles.stepOff]}
                          disabled={busy || l.qty <= 1}
                          onPress={() => setQty(l, l.qty - 1)}
                        >
                          <Feather name="minus" size={14} color={l.qty <= 1 ? theme.meta : theme.ink} />
                        </TouchableOpacity>
                        <Text style={styles.qtyTxt}>{l.qty} {l.unit || 'pkt'}</Text>
                        <TouchableOpacity
                          style={[styles.step, busy && styles.stepOff]}
                          disabled={busy}
                          onPress={() => setQty(l, l.qty + 1)}
                        >
                          <Feather name="plus" size={14} color={theme.ink} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.remove} disabled={busy} onPress={() => removeLine(l)}>
                          <Feather name="trash-2" size={14} color={theme.ruby} />
                          <Text style={styles.removeTxt}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.lineAmt}>{money(l.lineTotal ?? l.unitPrice * l.qty)}</Text>
                  </View>
                ))}
                <View style={styles.cartFoot}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cartFootLbl}>Cart total</Text>
                    <Text style={styles.cartFootVal}>{money(cartValue)}</Text>
                  </View>
                  <TouchableOpacity style={styles.checkout} onPress={() => navigation.navigate('Checkout')}>
                    <Text style={styles.checkoutTxt}>Checkout</Text>
                    <Feather name="arrow-right" size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : shown.length === 0 ? (
            <Empty
              icon="package"
              title={tab === 'Active' ? 'No active orders yet' : 'Nothing delivered yet'}
              body={
                tab === 'Active'
                  ? "Orders you place will show here while they're being processed and shipped."
                  : 'Delivered orders move here once they arrive.'
              }
              cta="Browse categories"
              onPress={() => navigation.navigate('Home')}
            />
          ) : (
            <View style={styles.card}>
              {shown.map((o, i) => {
                const tone = TONE[o.status] || TONE.pending;
                return (
                  <View key={o.id} style={[styles.line, i > 0 && styles.lineSep]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.lineName}>{o.id}</Text>
                      <Text style={styles.lineMeta}>{when(o)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <Text style={styles.lineAmt}>{money(o.grand)}</Text>
                      <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{o.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <ShopFooter />
        </ScrollView>
      )}

      <Mira role="customer" section="Your orders" />
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function Empty({
  icon, title, body, cta, onPress,
}: { icon: any; title: string; body: string; cta: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={26} color={theme.meta} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onPress}>
        <Text style={styles.emptyBtnTxt}>{cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },

  crumb: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, color: theme.meta },
  // The storefront sets page titles in the serif face.
  h1: { fontFamily: 'serif', fontSize: 30, color: theme.ink, marginTop: 8, letterSpacing: -0.3 },
  sub: { fontSize: 13.5, color: theme.meta, marginTop: 6, marginBottom: 18 },

  kpi: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  kpiLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: theme.meta },
  kpiValue: { fontFamily: 'serif', fontSize: 26, color: theme.ink, marginTop: 6 },
  kpiSub: { fontSize: 12.5, color: theme.meta, marginTop: 4 },

  tabs: { flexDirection: 'row', gap: 4, marginTop: 10, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.divider },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: theme.ink },
  tabTxt: { fontSize: 14, fontWeight: '500', color: theme.meta },
  tabTxtOn: { color: theme.ink, fontWeight: '700' },
  tabCount: {
    fontSize: 11, fontWeight: '700', color: theme.meta, backgroundColor: theme.paper,
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden',
  },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 16 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  lineSep: { borderTopWidth: 1, borderTopColor: theme.divider },
  lineName: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  lineMeta: { fontSize: 12.5, color: theme.meta, marginTop: 3 },
  lineAmt: { fontSize: 15, fontWeight: '800', color: theme.emeraldInk },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden', textTransform: 'capitalize',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  step: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center',
  },
  stepOff: { opacity: 0.45 },
  qtyTxt: { fontSize: 13, fontWeight: '700', color: theme.ink, minWidth: 54, textAlign: 'center' },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 4, paddingVertical: 6, paddingHorizontal: 6 },
  removeTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ruby },

  cartFoot: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderTopColor: theme.divider, paddingVertical: 14,
  },
  cartFootLbl: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: theme.meta },
  cartFootVal: { fontFamily: 'serif', fontSize: 21, color: theme.ink, marginTop: 3 },
  checkout: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.emerald,
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13,
  },
  checkoutTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },

  empty: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16,
    padding: 26, alignItems: 'center',
  },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: theme.ink, marginTop: 14, textAlign: 'center' },
  emptyBody: { fontSize: 13.5, color: theme.meta, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: theme.ink, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 13 },
  emptyBtnTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },

  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
