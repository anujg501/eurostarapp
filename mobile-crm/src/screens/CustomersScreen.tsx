import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { api, type Customer, type Order, type Payment } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TERMS: Record<string, string> = { cash: 'Cash', '15': '15 days', '30': '30 days', '45': '45 days', '60': '60 days' };

// The customer book. A rep sees their own customers and office/admin see the
// whole master — that is the server's decision, made from the token, and this
// screen simply shows what came back.
export default function CustomersScreen({ navigation, role = 'rep', repId, active = true }: any) {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = () => {
    api.customers()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setErr(e?.message || 'Could not load customers.'));
    // The desktop closes this screen with the rep's latest orders and whether
    // each is paid — the two questions a customer asks when you walk in.
    api.orders().then((o) => setOrders(Array.isArray(o) ? o : [])).catch(() => {});
    api.payments().then((p) => setPayments(Array.isArray(p) ? p : [])).catch(() => {});
  };

  // Reloads whenever this section comes to the front, so a customer added in
  // between is here on the way back. The list already drawn stays on screen
  // while that happens.
  useEffect(() => { if (active) load(); }, [active]);

  // A rep's /customers is already scoped to their book, so anything with no rep
  // on it is an account nobody owns — claimable, exactly as on the desktop.
  const mine = useMemo(() => (rows || []).filter((c) => !!c.rep), [rows]);
  const unassigned = useMemo(() => (rows || []).filter((c) => !c.rep), [rows]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = role === 'rep' ? mine : rows || [];
    if (!t) return base;
    return base.filter((c) =>
      [c.name, c.code, c.city, c.phone, c.gstin].filter(Boolean).some((v) => String(v).toLowerCase().includes(t))
    );
  }, [rows, mine, q, role]);

  const claim = async (c: Customer) => {
    if (!repId) { Alert.alert('Cannot claim', 'Your rep id is not loaded yet.'); return; }
    setClaiming(c.id);
    try {
      await api.claimCustomer(c.id, repId);
      load();
    } catch (e: any) {
      Alert.alert('Could not claim that customer', e?.message || 'Please try again.');
    } finally { setClaiming(null); }
  };

  // "Take an order" hands off to the Sales App with this customer in mind. The
  // app cannot deep-link into a checkout it does not own, so it opens the shop
  // on this phone if it is installed, and says so plainly when it is not.
  const takeOrder = async (c: Customer) => {
    const url = 'eurostarsales://';
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) { Linking.openURL(url); return; }
    Alert.alert(
      'Sales App not installed',
      `Orders for ${c.name} are placed in the Eurostar Sales App. Install it on this phone, or place the order from the web console.`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title={role === 'rep' ? 'My customers' : 'Customers'}
        sub={rows ? `${list.length} of ${rows.length} on the book` : 'loading…'}
        action="+ Add"
        onAction={() => navigation.navigate('AddCustomer')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={setQ}
          placeholder="Search name, code, city, phone…"
          placeholderTextColor={theme.meta}
          autoCorrect={false}
        />
      </View>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c) => c.id || c.code}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>{q ? 'Nothing matches that search.' : 'No customers yet.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
              <Text style={styles.meta}>
                {[item.city, item.phone].filter(Boolean).join(' · ') || 'No city or phone on file'}
              </Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>{TERMS[item.terms || 'cash'] || item.terms}</Text>
                {!!item.gstin && <Text style={[styles.tag, styles.tagGst]} numberOfLines={1}>GST {item.gstin}</Text>}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btn} onPress={() => takeOrder(item)}>
                  <Text style={styles.btnTxt}>🛒 Take an order</Text>
                </TouchableOpacity>
                {!!item.phone && (
                  <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                    <Text style={styles.ghostTxt}>📞 Call</Text>
                  </TouchableOpacity>
                )}
                {!!item.phone && (
                  <TouchableOpacity
                    style={styles.ghost}
                    onPress={() => Linking.openURL(`https://wa.me/91${String(item.phone).replace(/\D/g, '').slice(-10)}`)}
                  >
                    <Text style={styles.ghostTxt}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListFooterComponent={
            <View>
              {/* My recent orders, with what the office has actually confirmed. */}
              {orders.length > 0 && (
                <View style={{ marginTop: 22 }}>
                  <Text style={styles.sec}>My recent orders</Text>
                  <Text style={styles.secMeta}>latest orders from your customers</Text>
                  <View style={styles.ordersCard}>
                    {orders.slice(0, 8).map((o, i) => {
                      const pay = payments.find((p) => p.orderId === o.id && p.status !== 'failed');
                      return (
                        <View key={o.id} style={[styles.orderRow, i > 0 && styles.orderSep]}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.orderName} numberOfLines={1}>
                              {o.custName || o.customerName || o.customer || 'Customer'}
                            </Text>
                            <Text style={styles.orderMeta}>
                              {o.id} · {String(o.date || o.createdAt || '').slice(0, 10)} · {o.status}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', flexShrink: 0, gap: 3 }}>
                            <Text style={styles.orderAmt}>
                              ₹{Math.round(o.grand ?? 0).toLocaleString('en-IN')}
                            </Text>
                            {pay?.status === 'confirmed' && <Text style={styles.paid}>✓ Paid</Text>}
                            {pay?.status === 'pending' && <Text style={styles.pendingTxt}>Pending verification</Text>}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {role === 'rep' && unassigned.length > 0 ? (
                <View style={{ marginTop: 22 }}>
                <Text style={styles.sec}>Unassigned customers</Text>
                <Text style={styles.secMeta}>De-linked accounts — claim one to add it to your book</Text>
                {unassigned.map((c) => (
                  <View key={c.id} style={styles.card}>
                    <View style={styles.cardHead}>
                      <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.code}>{c.code}</Text>
                    </View>
                    <Text style={styles.meta}>
                      {[c.city, c.phone, c.gstin].filter(Boolean).join(' · ') || 'No details on file'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.btn, { marginTop: 10, alignSelf: 'flex-start' }, claiming === c.id && { opacity: 0.5 }]}
                      disabled={claiming === c.id}
                      onPress={() => claim(c)}
                    >
                      <Text style={styles.btnTxt}>{claiming === c.id ? 'Claiming…' : 'Claim customer'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                </View>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12, fontWeight: '700' },
  sec: { fontSize: 14, fontWeight: '800', color: theme.ink },
  secMeta: { fontSize: 12, color: theme.meta, marginTop: 2, marginBottom: 10 },

  ordersCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 14 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  orderSep: { borderTopWidth: 1, borderTopColor: theme.divider },
  orderName: { fontSize: 13.5, fontWeight: '600', color: theme.ink },
  orderMeta: { fontSize: 11.5, color: theme.meta, marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '700', color: theme.ink },
  paid: { fontSize: 11, fontWeight: '700', color: theme.emeraldInk },
  pendingTxt: { fontSize: 10.5, fontWeight: '700', color: theme.amber },

  searchWrap: { paddingHorizontal: 18, paddingTop: 14, width: '100%', maxWidth: 620, alignSelf: 'center' },
  search: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.ink,
  },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.ink },
  code: { fontSize: 12, fontFamily: 'monospace', color: theme.emeraldInk, flexShrink: 0 },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tag: {
    fontSize: 11.5, fontWeight: '600', color: theme.ink2, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagGst: { maxWidth: 220 },
  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
