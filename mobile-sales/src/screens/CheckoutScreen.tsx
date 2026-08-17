import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type Customer } from '../api';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader } from '../components/ShopChrome';

const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const CREDIT = ['15', '30', '45', '60'];

/**
 * The money, worked out exactly as the storefront works it out
 * (cartTotals in docs/app/screen-checkout.jsx). Duplicating the arithmetic is
 * what would let the two drift, so the rules are copied line for line: export
 * orders carry no GST, courier is ₹300 up to ₹1,000 and free above it.
 */
export function cartTotals(subtotal: number, city: string, discount = 0) {
  const isExport = (city || '').toLowerCase().includes('dubai');
  const discPct = Math.max(0, Math.min(100, Number(discount) || 0));
  const discAmt = Math.round((subtotal * discPct) / 100);
  const netSub = subtotal - discAmt;
  const tax = isExport ? 0 : Math.round(netSub * 0.03);
  const shipping = netSub > 1000 ? 0 : 300;
  return { subtotal, discPct, discAmt, netSub, isExport, tax, shipping, grand: netSub + tax + shipping };
}

/** "Dispatch by" — 3 working days, 5 on an export, as the web labels it. */
export function dispatchLabel(isExport: boolean) {
  const d = new Date();
  d.setDate(d.getDate() + (isExport ? 5 : 3));
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Review & confirm — the last screen before an order leaves the phone.
 *
 * The lines are the customer's own open carts on the server, not a local copy,
 * so what is charged here is what the office already holds. Placing the order
 * posts it and closes those carts.
 */
export default function CheckoutScreen({ navigation }: any) {
  const [carts, setCarts] = useState<any[] | null>(null);
  const [cust, setCust] = useState<Customer | null>(null);
  const [who, setWho] = useState('');
  const [addr, setAddr] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');
  // Never overwrite an address the customer has started typing.
  const addrTouched = useRef(false);

  // A rep or the back office orders on somebody else's behalf, so they pick who
  // first — the same Customer card the website shows staff.
  const [role, setRole] = useState('');
  const staff = role === 'rep' || role === 'office';
  const [book, setBook] = useState<Customer[] | null>(null);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [pickId, setPickId] = useState('');
  const [pickOpen, setPickOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const load = useCallback(async () => {
    try {
      const [me, c] = await Promise.all([
        api.me().catch(() => null),
        api.carts().catch(() => [] as any[]),
      ]);
      if (me) { setWho(me.name || ''); setContact((v) => v || me.name || ''); setRole(me.role || ''); }
      setCarts(Array.isArray(c) ? c.filter((x) => x.status === 'active') : []);

      // Staff order for somebody else, so the book replaces the self-lookup:
      // the signed-in rep is not the customer being billed.
      if (me?.role === 'rep' || me?.role === 'office') {
        const list = await api.customers().catch(() => [] as Customer[]);
        setBook(list);
        setPickId((prev) => (list.some((x) => x.id === prev) ? prev : list[0]?.id || ''));
        return;
      }

      const ph = me?.phone || '';
      if (ph) {
        setPhone((v) => v || ph);
        const record = await api.customerByPhone(ph).catch(() => null);
        if (record) {
          setCust(record);
          // The saved delivery address, falling back to the city — the same
          // preference the website's Ship-to box uses.
          if (!addrTouched.current) setAddr(record.shipAddress || record.city || '');
        }
      }
    } catch (e: any) {
      setErr(e?.message || 'Could not load your cart.');
      setCarts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Who the order is actually for: the picked customer when staff are ordering
  // on behalf, otherwise the signed-in customer's own record.
  const picked: Customer | null = staff
    ? (book || []).find((c) => c.id === pickId) || null
    : cust;

  // Switching customer re-points the delivery address, unless it has been typed
  // over — the address belongs to whoever is being billed.
  useEffect(() => {
    if (!staff || !picked || addrTouched.current) return;
    setAddr(picked.shipAddress || picked.city || '');
    setContact(picked.contact || picked.name || '');
    setPhone(picked.phone || '');
  }, [staff, picked?.id]);

  // Staff cannot place until they have said who for: an existing customer
  // chosen, or enough detail to create a new one.
  const staffReady =
    !staff || (mode === 'existing' ? !!picked : newName.trim().length >= 2 && newPhone.trim().length >= 6);

  const lines = useMemo(() => (carts || []).flatMap((c) => c.lines || []), [carts]);
  const lineTotal = (l: any) => l.lineTotal ?? (l.unitPrice || 0) * (l.qty || 0);
  const subtotal = useMemo(() => lines.reduce((a, l) => a + lineTotal(l), 0), [lines]);
  // The office can set a standing discount on the cart; honour it here rather
  // than quietly charging the undiscounted total.
  const discount = (carts || []).reduce((a, c) => Math.max(a, c.discount || 0), 0);
  const t = cartTotals(subtotal, picked?.city || '', discount);
  const dispatchBy = dispatchLabel(t.isExport);
  // A rep's own order is billed as a cash customer, as the website says.
  const terms = t.isExport
    ? 'LC at sight'
    : CREDIT.includes(String(picked?.terms)) ? `NET ${picked?.terms} days` : 'Cash · pay then ship';
  const totalPcs = lines.reduce((a, l) => a + (l.qty || 0), 0);

  const place = async () => {
    if (placing || !lines.length) return;
    if (!staffReady) { setErr('Choose the customer this order is for.'); return; }
    if (!addr.trim()) { setErr('A delivery address is needed before the order can be placed.'); return; }
    setErr('');
    setPlacing(true);

    // A new customer is created in the real master first, so the order attaches
    // to a proper record with its own code and rep mapping.
    let buyer = picked;
    if (staff && mode === 'new') {
      try {
        buyer = await api.createCustomer(newName.trim(), newPhone.trim());
      } catch (e: any) {
        setErr(e?.message || 'Could not create that customer.');
        setPlacing(false);
        return;
      }
    }
    // Timestamp-based id, as the website generates: the old fixed-range random
    // ids collided and the server upsert overwrote existing orders.
    const id = 'SO-' + Date.now().toString().slice(-8);
    try {
      await api.createOrder({
        id,
        customerId: buyer?.id,
        // The rep who placed it is stamped from the token server-side, so the
        // order names the buyer here, never the signed-in staff member.
        customer: { name: buyer?.name || who, phone: buyer?.phone || phone, code: buyer?.code || '', id: buyer?.id || '' },
        code: buyer?.code || '',
        city: (buyer?.city || '').split(',')[0].trim(),
        value: t.grand,
        lines: lines.map((l: any) => ({
          name: l.name, categoryKey: l.categoryKey, grade: l.grade, colour: l.colour,
          shape: l.shape, size: l.size, unit: l.unit, unitMode: l.unit,
          ct: l.qty, unitPrice: l.unitPrice, lineTotal: lineTotal(l),
        })),
        isExport: t.isExport,
        // The app has no payment gateway, so an order leaves it unpaid and the
        // office collects — the same state a credit order is placed in.
        paid: false,
        source: 'Sales App',
        dispatchBy,
        ts: Date.now(),
      });
      // The order holds these lines now; leaving the carts open would offer
      // them again as if nothing had been bought.
      await Promise.all((carts || []).map((c) => api.closeCart(c.id).catch(() => {})));
      navigation.replace('Confirmed', {
        id, grand: t.grand, dispatchBy, terms, name: buyer?.name || who,
      });
    } catch (e: any) {
      setErr(e?.message || 'Could not place the order. Please try again.');
      setPlacing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Orders" who={who} />

      {carts === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.crumb}>CHECKOUT</Text>
          <Text style={styles.h1}>Review &amp; confirm</Text>
          <Text style={styles.sub}>
            {staff
              ? picked?.name
                ? [picked.name, picked.code].filter(Boolean).join(' · ')
                : 'Select the customer below'
              : [picked?.name || who, picked?.code ? `Account ${picked.code}` : ''].filter(Boolean).join(' · ')}
          </Text>

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={15} color={theme.ink} />
            <Text style={styles.backTxt}>Back to cart</Text>
          </TouchableOpacity>

          {lines.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyBody}>Add sizes while browsing and they will be waiting here.</Text>
              <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.primaryTxt}>Browse categories</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {staff && (
                <View style={styles.card}>
                  <Text style={styles.sec}>Customer</Text>
                  <Text style={[styles.meta, { marginTop: -6, marginBottom: 12 }]}>
                    {role === 'office'
                      ? 'Back office · ordering on behalf of a customer.'
                      : 'Sales rep · ordering on behalf of a customer (billed as cash customer).'}
                  </Text>

                  <View style={styles.segs}>
                    {([['existing', 'Choose customer'], ['new', 'New customer']] as const).map(([id, label]) => (
                      <TouchableOpacity
                        key={id}
                        style={[styles.seg, mode === id && styles.segOn]}
                        onPress={() => setMode(id)}
                      >
                        <Text style={[styles.segTxt, mode === id && styles.segTxtOn]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {mode === 'existing' ? (
                    <>
                      <Lbl>Select a customer</Lbl>
                      <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setPickOpen(true)}>
                        <Text style={styles.selectTxt} numberOfLines={1}>
                          {book === null
                            ? 'Loading customers…'
                            : picked
                              ? [picked.name, picked.city].filter(Boolean).join(' · ') + (picked.code ? ` (${picked.code})` : '')
                              : 'No customers yet — use “New customer”'}
                        </Text>
                        <Feather name="chevron-down" size={16} color={theme.meta} />
                      </TouchableOpacity>
                      {!!picked?.phone && <Text style={[styles.meta, { marginBottom: 4 }]}>{picked.phone}</Text>}
                    </>
                  ) : (
                    <>
                      <Lbl>Customer name</Lbl>
                      <TextInput
                        style={styles.input} value={newName} onChangeText={setNewName}
                        placeholder="Firm / person" placeholderTextColor={theme.meta}
                      />
                      <Lbl>Phone number</Lbl>
                      <TextInput
                        style={styles.input} value={newPhone} onChangeText={setNewPhone}
                        placeholder="10-digit mobile" placeholderTextColor={theme.meta} keyboardType="phone-pad"
                      />
                    </>
                  )}
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.sec}>Delivery address</Text>
                <Lbl>Ship to</Lbl>
                <TextInput
                  style={[styles.input, styles.area]} value={addr} multiline
                  onChangeText={(v) => { addrTouched.current = true; setAddr(v); }}
                  placeholder="Full delivery address" placeholderTextColor={theme.meta}
                />
                <Lbl>Contact person</Lbl>
                <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholderTextColor={theme.meta} />
                <Lbl>Phone</Lbl>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={theme.meta} />
              </View>

              <View style={styles.card}>
                <Text style={styles.sec}>Delivery</Text>
                <Text style={styles.strong}>{t.isExport ? 'International insured courier' : 'Insured domestic courier'}</Text>
                <Text style={styles.meta}>Dispatch by {dispatchBy} · tracking shared on WhatsApp</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sec}>Order notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.area]} value={notes} onChangeText={setNotes} multiline
                  placeholder="Packing instructions, certificate requests, delivery preferences…"
                  placeholderTextColor={theme.meta}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sec}>Order summary</Text>
                {lines.map((l: any, i: number) => (
                  <View key={l.id || i} style={styles.sumRow}>
                    <Text style={styles.sumName} numberOfLines={2}>
                      {l.name}
                      {l.colour ? ` · ${l.colour}` : ''}
                      <Text style={styles.meta}>  {[l.size, `× ${(l.qty || 0).toLocaleString('en-IN')}`].filter(Boolean).join(' ')}</Text>
                    </Text>
                    <Text style={styles.sumAmt}>{money(lineTotal(l))}</Text>
                  </View>
                ))}

                <View style={styles.rule} />
                <Row label="Subtotal" value={money(t.subtotal)} />
                {t.discPct > 0 && <Row label={`Discount · ${t.discPct}%`} value={`− ${money(t.discAmt)}`} tone={theme.emeraldInk} />}
                {t.tax > 0 && <Row label="GST 3%" value={money(t.tax)} />}
                <Row label={`Courier${t.shipping === 0 ? ' · free over ₹1,000' : ''}`} value={t.shipping === 0 ? 'Free' : money(t.shipping)} />
                <View style={styles.rule} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLbl}>Total payable</Text>
                  <Text style={styles.totalVal}>{money(t.grand)}</Text>
                </View>
                <Text style={[styles.meta, { textAlign: 'right', marginTop: 6 }]}>
                  {lines.length} lines · {totalPcs.toLocaleString('en-IN')} pcs · {terms}
                </Text>
              </View>

              {!!err && <Text style={styles.err}>{err}</Text>}

              <TouchableOpacity style={[styles.primary, placing && { opacity: 0.6 }]} disabled={placing} onPress={place}>
                <Text style={styles.primaryTxt}>{placing ? 'Placing…' : `Place order · ${money(t.grand)}`}</Text>
              </TouchableOpacity>
              <Text style={styles.foot}>
                The office confirms the order and shares payment details — nothing is charged here.
              </Text>
            </>
          )}
        </ScrollView>
      )}

      {/* The customer book, as a sheet — the web's <select>. */}
      <Modal visible={pickOpen} transparent animationType="fade" onRequestClose={() => setPickOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPickOpen(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <Text style={styles.sheetH}>SELECT A CUSTOMER</Text>
            <ScrollView>
              {(book || []).map((c) => {
                const on = c.id === pickId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.sheetRow, on && styles.sheetRowOn]}
                    onPress={() => { addrTouched.current = false; setPickId(c.id); setPickOpen(false); }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.sheetTxt} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.meta}>{[c.city, c.code].filter(Boolean).join(' · ')}</Text>
                    </View>
                    {on && <Feather name="check" size={15} color={theme.emeraldInk} />}
                  </TouchableOpacity>
                );
              })}
              {!(book || []).length && (
                <Text style={[styles.meta, { padding: 20 }]}>No customers are mapped to you yet.</Text>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Mira role="customer" section="Checkout" />
    </View>
  );
}

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.lbl}>{String(children).toUpperCase()}</Text>
);

const Row = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLbl, tone ? { color: tone } : null]}>{label}</Text>
    <Text style={[styles.rowVal, tone ? { color: tone } : null]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 120, width: '100%', maxWidth: 620, alignSelf: 'center' },

  crumb: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, color: theme.meta },
  h1: { fontFamily: 'serif', fontSize: 30, color: theme.ink, marginTop: 8, letterSpacing: -0.3 },
  sub: { fontSize: 13.5, color: theme.meta, marginTop: 6 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, marginBottom: 16 },
  backTxt: { fontSize: 13.5, fontWeight: '600', color: theme.ink },

  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  sec: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 12 },
  strong: { fontSize: 14, fontWeight: '600', color: theme.ink },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 4 },

  lbl: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta, marginBottom: 6 },
  input: {
    backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: theme.ink, marginBottom: 12,
  },
  area: { height: 76, textAlignVertical: 'top' },

  // Choose customer / New customer, the web's two-button switch.
  segs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  seg: {
    flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.paper,
  },
  segOn: { borderColor: theme.ink, backgroundColor: theme.card },
  segTxt: { fontSize: 13, fontWeight: '600', color: theme.meta },
  segTxtOn: { color: theme.ink, fontWeight: '700' },

  select: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectTxt: { flex: 1, fontSize: 14, color: theme.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingVertical: 10, paddingBottom: 26, maxHeight: '70%',
  },
  sheetH: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 13 },
  sheetRowOn: { backgroundColor: theme.emeraldSoft },
  sheetTxt: { fontSize: 15, color: theme.ink },

  sumRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  sumName: { flex: 1, fontSize: 13.5, color: theme.ink, lineHeight: 20 },
  sumAmt: { fontSize: 13.5, fontWeight: '700', color: theme.ink },

  rule: { height: 1, backgroundColor: theme.divider, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  rowLbl: { fontSize: 13, color: theme.meta },
  rowVal: { fontSize: 13, color: theme.ink, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLbl: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  totalVal: { fontFamily: 'serif', fontSize: 22, color: theme.emeraldInk },

  primary: { backgroundColor: theme.emerald, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  primaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  foot: { fontSize: 12, color: theme.meta, textAlign: 'center', marginTop: 12, lineHeight: 18 },

  emptyTitle: { fontFamily: 'serif', fontSize: 20, color: theme.ink, textAlign: 'center' },
  emptyBody: { fontSize: 13.5, color: theme.meta, textAlign: 'center', marginTop: 8, marginBottom: 4 },

  err: { color: theme.ruby, fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
