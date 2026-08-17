import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Image, Linking, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, stripNulls, priceFor, BASE_URL, type Order, type Customer, type PriceSnapshot } from '../api';
import { getSnapshot } from '../priceCache';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';
import { cartTotals } from './CheckoutScreen';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TRADE_DESK = '917710065480';
// The minimum the website enforces before checkout is offered.
const MIN_ORDER = 1000;

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
  const [cust, setCust] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  // Pieces-per-packet and colour swatches are not stored on a cart line; they
  // come from the catalogue the app already has cached.
  const [snap, setSnap] = useState<PriceSnapshot | null>(null);
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
        const record = await api.customerByPhone(phone).catch(() => null);
        if (record) {
          setCust(record);
          if (record.terms) setTerms(record.terms === 'cash' ? 'Cash account' : `NET ${record.terms} account`);
        }
      }
    } catch (e: any) {
      setErr(e?.message || 'Could not load your orders.');
      setRows([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Cached after the first browse, so this is usually instant and never blocks
  // the cart from drawing.
  useEffect(() => { getSnapshot().then(setSnap).catch(() => {}); }, []);

  // The server stores the cart, so an edit is a save rather than local state.
  // The lines it sends back carry an `id` the write schema does not accept, and
  // lineTotal is the server's own arithmetic — both are dropped here.
  const linesToSave = (cart: any, keep: (l: any) => boolean, patch?: (l: any) => any) =>
    (cart.lines || []).filter(keep).map((l: any) => {
      const { skuId, name, categoryKey, grade, colour, shape, size, unit, qty, unitPrice } = patch ? patch(l) : l;
      // stripNulls, because the optional fields come back null on a line that
      // did not set them and the write schema takes a missing key but not null.
      return stripNulls({ skuId, name, categoryKey, grade, colour, shape, size, unit, qty, unitPrice });
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

  const lineTotal = (l: any) => l.lineTotal ?? (l.unitPrice || 0) * (l.qty || 0);
  const cartLines = useMemo(
    () => carts.reduce((a, c) => a + (c.lines?.length || 0), 0),
    [carts]
  );
  // The subtotal of what is in the basket. Taken from the lines rather than the
  // server's cart totals, so it still adds up while an edit is being saved.
  const cartValue = useMemo(
    () => carts.reduce((a, c) => a + (c.lines || []).reduce((s: number, l: any) => s + (l.lineTotal ?? (l.unitPrice || 0) * (l.qty || 0)), 0), 0),
    [carts]
  );

  /** Pieces in one packet of this line, read off the catalogue. */
  const pcsPer = (l: any): number => {
    const block = snap?.[l.categoryKey || ''];
    const row = block ? priceFor(block, l.grade || '', l.colour || '', l.shape || '', l.size || '') : null;
    return row?.pcs || 0;
  };

  /** The colour's swatch, from the catalogue's own palette. */
  const hexFor = (l: any): string | undefined => {
    const meta = snap?.__catalog__?.[l.categoryKey || ''];
    const list = meta?.coloursByGrade?.[l.grade || ''] || [];
    return list.find((c) => c.id === l.colour)?.hex;
  };

  // One card per product, its sizes underneath — the website groups the cart
  // this way rather than listing every size as an unrelated row.
  const groups = useMemo(() => {
    const out: Record<string, { key: string; cartId: string; l0: any; lines: any[] }> = {};
    for (const c of carts) {
      for (const l of c.lines || []) {
        const key = [l.categoryKey, l.grade, l.colour, l.shape].join('|');
        (out[key] = out[key] || { key, cartId: c.id, l0: l, lines: [] }).lines.push({ ...l, cartId: c.id });
      }
    }
    return Object.values(out).map((g) => ({
      ...g,
      // Numeric order, so 0.9 mm does not sit after 10 mm.
      lines: g.lines.sort((a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0)),
    }));
  }, [carts]);

  const allLines = useMemo(() => groups.flatMap((g) => g.lines), [groups]);
  const totalUnits = allLines.reduce((a, l) => a + (l.qty || 0), 0);
  const totalPcs = allLines.reduce((a, l) => a + (l.qty || 0) * pcsPer(l), 0);
  // The same arithmetic checkout uses, so the two screens cannot quote
  // different totals.
  const t = cartTotals(cartValue, cust?.city || '', (carts || []).reduce((a, c) => Math.max(a, c.discount || 0), 0));
  const belowMin = t.subtotal > 0 && t.subtotal < MIN_ORDER;

  /** The cart as a WhatsApp message — the same shape the website sends. */
  const shareWhatsApp = () => {
    const body = allLines
      .map((l) => `• ${l.name}${l.colour ? ` (${l.colour})` : ''} ${l.size || ''} × ${(l.qty || 0).toLocaleString('en-IN')} ${l.unit || 'pkt'} = ${money(lineTotal(l))}`)
      .join('\n');
    const msg =
      `*Eurostar — cart*\n${cust?.name || who}${cust?.code ? ` · ${cust.code}` : ''}\n\n${body}\n\n` +
      `*Total payable: ${money(t.grand)}*\n(${terms || 'Cash'})` +
      (notes.trim() ? `\n\nNotes: ${notes.trim()}` : '');
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`).catch(() =>
      Alert.alert('Could not open WhatsApp', 'Is it installed on this phone?')
    );
  };

  const removeLine = (line: any) => {
    const cart = carts.find((c) => c.id === line.cartId);
    if (!cart) return;
    applyCart(cart.id, linesToSave(cart, (l) => l.id !== line.id));
  };

  /** Drop a whole product — every size of it — in one save. */
  const removeGroup = (g: { lines: any[] }) => {
    const ids = new Set(g.lines.map((l) => l.id));
    const cart = carts.find((c) => c.id === g.lines[0]?.cartId);
    if (!cart) return;
    applyCart(cart.id, linesToSave(cart, (l) => !ids.has(l.id)));
  };

  const setQty = (line: any, qty: number) => {
    const cart = carts.find((c) => c.id === line.cartId);
    if (!cart || qty < 1) return;
    applyCart(cart.id, linesToSave(cart, () => true, (l) => (l.id === line.id ? { ...l, qty } : l)));
  };

  const active = (rows || []).filter((o) => !CLOSED.includes(o.status));
  const delivered = (rows || []).filter((o) => o.status === 'delivered');
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
          {/* The website titles the page for the tab you are on. */}
          <Text style={styles.h1}>{tab === 'Cart' && cartLines > 0 ? 'Your cart' : 'Your orders'}</Text>
          <Text style={styles.sub}>
            {[cust?.name || who, 'Account', terms].filter(Boolean).join(' · ')}
          </Text>

          <Kpi label="ACTIVE ORDERS" value={String(active.length)} />
          <Kpi
            label="IN CART"
            value={`${cartLines} line${cartLines === 1 ? '' : 's'}`}
            sub={
              cartLines
                ? `${totalUnits} ${groups[0]?.l0.unit || 'pkt'} · ${money(cartValue)}`
                : '—'
            }
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
              <>
                {/* Where it ships, and the way to change it. */}
                <View style={[styles.card, styles.shipRow]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.kpiLabel}>SHIP TO</Text>
                    <Text style={styles.shipName}>
                      {[cust?.name || who, cust?.city].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.lineMeta}>
                      {['c/o ' + (cust?.contact || cust?.name || who), cust?.phone].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.ghost} onPress={() => navigation.navigate('Account')}>
                    <Text style={styles.ghostTxt}>Edit address</Text>
                  </TouchableOpacity>
                </View>

                {/* One card per product, its sizes underneath. */}
                {groups.map((g) => {
                  const gUnits = g.lines.reduce((a, l) => a + (l.qty || 0), 0);
                  const gPcs = g.lines.reduce((a, l) => a + (l.qty || 0) * pcsPer(l), 0);
                  const gAmt = g.lines.reduce((a, l) => a + lineTotal(l), 0);
                  const hex = hexFor(g.l0);
                  const unit = g.l0.unit || 'pkt';
                  return (
                    <View key={g.key} style={styles.group}>
                      <View style={styles.groupHead}>
                        <View style={[styles.groupArt, { backgroundColor: theme.paper }]} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.groupName}>{g.l0.name || 'Item'}</Text>
                          <Text style={styles.groupMeta}>
                            {[g.l0.shape, g.l0.grade].filter(Boolean).join(' · ')}
                          </Text>
                          {!!g.l0.colour && (
                            <View style={styles.swatchRow}>
                              <View style={[styles.dot, { backgroundColor: hex || theme.border }]} />
                              <Text style={styles.groupMeta}>{g.l0.colour}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.kpiLabel}>
                            {g.lines.length} SIZE{g.lines.length > 1 ? 'S' : ''}
                          </Text>
                          <Text style={styles.groupAmt}>{money(gAmt)}</Text>
                          <Text style={styles.lineMeta}>
                            {gUnits} {unit}{gPcs ? ` · ${gPcs.toLocaleString('en-IN')} pcs` : ''}
                          </Text>
                        </View>
                      </View>

                      {g.lines.map((l) => {
                        const pcs = pcsPer(l);
                        return (
                          <View key={l.id} style={styles.sizeRow}>
                            <View style={styles.sizeHead}>
                              <Text style={styles.sizeMm}>{String(l.size || '').replace(' mm', '')}
                                <Text style={styles.sizeUnit}> mm</Text>
                              </Text>
                              <View style={{ flex: 1 }} />
                              {/* Drop just this size, as the web's × does. */}
                              <TouchableOpacity onPress={() => removeLine(l)} disabled={busy} hitSlop={8}>
                                <Feather name="x" size={16} color={theme.meta} />
                              </TouchableOpacity>
                            </View>

                            <View style={styles.stepRow}>
                              <TouchableOpacity
                                style={[styles.step, (busy || l.qty <= 1) && styles.stepOff]}
                                disabled={busy || l.qty <= 1}
                                onPress={() => setQty(l, l.qty - 1)}
                              >
                                <Feather name="minus" size={14} color={l.qty <= 1 ? theme.meta : theme.ink} />
                              </TouchableOpacity>
                              <Text style={styles.stepVal}>{l.qty}</Text>
                              <TouchableOpacity
                                style={[styles.step, busy && styles.stepOff]}
                                disabled={busy}
                                onPress={() => setQty(l, l.qty + 1)}
                              >
                                <Feather name="plus" size={14} color={theme.ink} />
                              </TouchableOpacity>
                            </View>

                            <View style={styles.sizeFoot}>
                              <Text style={styles.lineMeta}>
                                {pcs ? `Pieces: ${(l.qty * pcs).toLocaleString('en-IN')}` : `${l.qty} ${unit}`}
                              </Text>
                              <Text style={styles.lineMeta}>@ {money(l.unitPrice)}</Text>
                            </View>
                            <Text style={styles.sizeAmt}>{money(lineTotal(l))}</Text>
                          </View>
                        );
                      })}

                      <View style={styles.groupActions}>
                        <TouchableOpacity
                          style={styles.groupAct}
                          onPress={() => navigation.navigate('Category', { cat: g.l0.categoryKey, name: g.l0.name })}
                        >
                          <Feather name="plus" size={14} color={theme.ink} />
                          <Text style={styles.groupActTxt}>Add more sizes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.groupAct}
                          disabled={busy}
                          onPress={() => removeGroup(g)}
                        >
                          <Feather name="x" size={14} color={theme.ruby} />
                          <Text style={[styles.groupActTxt, { color: theme.ruby }]}>Remove product</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.card}>
                  <Text style={styles.kpiLabel}>
                    ORDER NOTES <Text style={{ fontWeight: '400' }}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.notes}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Matched pairs, certificate requirements, packing preferences…"
                    placeholderTextColor={theme.meta}
                  />
                </View>

                {/* Order summary — the invoice panel the website keeps beside the cart. */}
                <View style={styles.card}>
                  <Text style={[styles.kpiLabel, { marginBottom: 14 }]}>ORDER SUMMARY</Text>
                  <View style={styles.miniGrid}>
                    <Mini label="PRODUCTS" value={String(groups.length)} />
                    <Mini label="LINE ITEMS" value={String(allLines.length)} />
                    <Mini label={`TOTAL ${(groups[0]?.l0.unit || 'PKT').toUpperCase()}`} value={String(totalUnits)} />
                    <Mini label="TOTAL PIECES" value={totalPcs ? totalPcs.toLocaleString('en-IN') : '—'} />
                  </View>

                  <View style={styles.rule} />
                  <Row label="Subtotal" value={money(t.subtotal)} />
                  {t.discPct > 0 && (
                    <Row label={`Discount · ${t.discPct}%`} value={`− ${money(t.discAmt)}`} tone={theme.emeraldInk} />
                  )}
                  <Row
                    label={t.isExport ? 'Export · zero rated' : 'GST · 3%'}
                    value={t.tax === 0 ? '—' : money(t.tax)}
                  />
                  <Row
                    label={`Courier ${t.shipping === 0 ? '· free over ₹1,000' : '· flat'}`}
                    value={t.shipping === 0 ? 'Free' : money(t.shipping)}
                  />
                  <View style={styles.rule} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLbl}>Total payable</Text>
                    <Text style={styles.totalVal}>{money(t.grand)}</Text>
                  </View>

                  <View style={styles.termsBox}>
                    <Text style={styles.kpiLabel}>PAYMENT TERMS</Text>
                    <Text style={styles.termsShort}>{terms || 'Cash'}</Text>
                    <Text style={styles.lineMeta}>
                      {terms.startsWith('NET')
                        ? 'Pay within the agreed credit period'
                        : 'Pay before dispatch — order ships once payment is received'}
                    </Text>
                  </View>

                  {belowMin && (
                    <View style={styles.warn}>
                      <Text style={styles.warnTxt}>
                        <Text style={{ fontWeight: '800' }}>Minimum order ₹1,000.</Text>{' '}
                        Add {money(MIN_ORDER - t.subtotal)} more to check out.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.primary, belowMin && { opacity: 0.5 }]}
                    disabled={belowMin}
                    onPress={() => navigation.navigate('Checkout')}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.primaryTxt}>Proceed to checkout — {money(t.grand)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.whats} onPress={shareWhatsApp}>
                    <Feather name="message-circle" size={15} color="#fff" />
                    <Text style={styles.whatsTxt}>Share cart on WhatsApp</Text>
                  </TouchableOpacity>

                  {/* Company UPI QR, served by the same back room as the shop. */}
                  <TouchableOpacity style={styles.qrHead} onPress={() => setQrOpen((v) => !v)}>
                    <Feather name="grid" size={15} color={theme.ink} />
                    <Text style={styles.qrHeadTxt}>Show QR code to pay</Text>
                    <View style={{ flex: 1 }} />
                    <Feather name={qrOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.meta} />
                  </TouchableOpacity>
                  {qrOpen && (
                    <View style={styles.qrBody}>
                      <Image
                        source={{ uri: `${BASE_URL}/assets/eurostar-upi-qr.png` }}
                        style={styles.qrImg}
                        resizeMode="contain"
                      />
                      <Text style={styles.termsShort}>Eurostar Gem Technologies Inc.</Text>
                      <Text style={styles.lineMeta}>Scan with any UPI app · {money(t.grand)}</Text>
                    </View>
                  )}

                  <Text style={styles.fine}>
                    By placing this order you accept Eurostar's trade terms. Dispatch begins after
                    confirmation, typically within 2–3 business days. Insurance covers parcel value
                    to {money(t.grand)} until delivery.
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={[styles.kpiLabel, { marginBottom: 12 }]}>NEED HELP?</Text>
                  <TouchableOpacity
                    style={styles.helpBtn}
                    onPress={() => Linking.openURL(`https://wa.me/${TRADE_DESK}`).catch(() => {})}
                  >
                    <Feather name="message-circle" size={15} color={theme.ink} />
                    <Text style={styles.helpTxt}>WhatsApp trade desk</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.helpBtn}
                    onPress={() => Linking.openURL('tel:+917710065480').catch(() => {})}
                  >
                    <Feather name="phone" size={15} color={theme.ink} />
                    <Text style={styles.helpTxt}>+91 77100 65480</Text>
                  </TouchableOpacity>
                </View>
              </>
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

const Mini = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.mini}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.miniVal}>{value}</Text>
  </View>
);

const Row = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <View style={styles.sumRow}>
    <Text style={[styles.sumLbl, tone ? { color: tone } : null]}>{label}</Text>
    <Text style={[styles.sumVal, tone ? { color: tone } : null]}>{value}</Text>
  </View>
);

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
  // Ship-to
  shipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shipName: { fontSize: 14.5, fontWeight: '700', color: theme.ink, marginTop: 5 },
  ghost: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 9,
    paddingHorizontal: 13, paddingVertical: 9, backgroundColor: theme.paper,
  },
  ghostTxt: { fontSize: 12.5, fontWeight: '700', color: theme.ink },

  // Product group
  group: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  groupHead: { flexDirection: 'row', gap: 12 },
  groupArt: { width: 52, height: 52, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  groupName: { fontFamily: 'serif', fontSize: 18, color: theme.ink, lineHeight: 24 },
  groupMeta: { fontSize: 12, color: theme.meta, marginTop: 3 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  groupAmt: { fontFamily: 'serif', fontSize: 20, color: theme.ink, marginTop: 4 },

  sizeRow: {
    borderTopWidth: 1, borderTopColor: theme.divider, marginTop: 14, paddingTop: 12,
  },
  sizeHead: { flexDirection: 'row', alignItems: 'center' },
  sizeMm: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: theme.ink },
  sizeUnit: { fontSize: 11, color: theme.meta },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    backgroundColor: theme.surface, paddingHorizontal: 6, paddingVertical: 5, marginTop: 8,
  },
  stepVal: { fontSize: 15, fontWeight: '700', color: theme.ink },
  sizeFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  sizeAmt: { fontSize: 15, fontWeight: '800', color: theme.ink, marginTop: 6 },

  groupActions: {
    flexDirection: 'row', gap: 8, marginTop: 14,
    borderTopWidth: 1, borderTopColor: theme.divider, paddingTop: 12,
  },
  groupAct: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingRight: 12 },
  groupActTxt: { fontSize: 13, fontWeight: '600', color: theme.ink },

  notes: {
    backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: theme.ink,
    height: 78, textAlignVertical: 'top', marginTop: 8,
  },

  // Order summary
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mini: { width: '50%', marginBottom: 14 },
  miniVal: { fontFamily: 'serif', fontSize: 20, color: theme.ink, marginTop: 3 },
  rule: { height: 1, backgroundColor: theme.divider, marginVertical: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLbl: { fontSize: 13, color: theme.meta },
  sumVal: { fontSize: 13, fontWeight: '600', color: theme.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLbl: { fontSize: 15, fontWeight: '700', color: theme.ink },
  totalVal: { fontFamily: 'serif', fontSize: 24, color: theme.ink },

  termsBox: { backgroundColor: theme.paper, borderRadius: 10, padding: 13, marginTop: 16 },
  termsShort: { fontSize: 14, fontWeight: '700', color: theme.ink, marginTop: 5 },

  warn: {
    backgroundColor: '#FCEBC8', borderWidth: 1, borderColor: '#E6CC7F',
    borderRadius: 10, padding: 11, marginTop: 14,
  },
  warnTxt: { fontSize: 12.5, color: '#7A5214', lineHeight: 18 },

  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: theme.emerald, borderRadius: 12, paddingVertical: 15, marginTop: 18,
  },
  primaryTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  whats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 13, marginTop: 8,
  },
  whatsTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  qrHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 13, backgroundColor: theme.paper,
  },
  qrHeadTxt: { fontSize: 14, fontWeight: '700', color: theme.ink },
  qrBody: { alignItems: 'center', paddingVertical: 16 },
  qrImg: { width: 180, height: 180, marginBottom: 10 },

  fine: { fontSize: 11.5, color: theme.meta, lineHeight: 17, marginTop: 14 },

  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 13, marginBottom: 8, backgroundColor: theme.paper,
  },
  helpTxt: { fontSize: 14, fontWeight: '600', color: theme.ink },

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
