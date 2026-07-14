import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { theme } from '../theme';
import { useCart, CartLine } from '../cart';

const UNIT_LABEL: Record<string, string> = {
  'per pc': 'pc', 'per strand': 'strand', 'per set': 'set', 'per strip': 'strip', 'per packet': 'pkt',
};

// GST estimate for the summary only — the back room computes the authoritative
// grand total (tax/shipping/insurance) from the order's line items.
const GST_RATE = 0.03;

function Line({ line }: { line: CartLine }) {
  const { setQty, remove } = useCart();
  const { product, qty } = line;
  const unit = UNIT_LABEL[product.unit] || product.unit;
  const step = product.moq >= 100 ? 50 : product.moq >= 20 ? 10 : product.moq >= 6 ? 2 : 1;
  return (
    <View style={styles.line}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>₹{product.price.toLocaleString('en-IN')}/{unit} · {product.shape} {product.size}</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setQty(product.id, Math.max(product.moq, qty - step))} style={styles.stepBtn}>
            <Text style={styles.stepTxt}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{qty.toLocaleString('en-IN')} {unit}</Text>
          <TouchableOpacity onPress={() => setQty(product.id, qty + step)} style={styles.stepBtn}>
            <Text style={styles.stepTxt}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.lineTotal}>₹{(product.price * qty).toLocaleString('en-IN')}</Text>
        <TouchableOpacity onPress={() => remove(product.id)}>
          <Text style={styles.remove}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }: any) {
  const { lines, subtotal, clear } = useCart();
  const [placing, setPlacing] = useState(false);
  const tax = Math.round(subtotal * GST_RATE);
  const estTotal = subtotal + tax;

  async function placeOrder() {
    setPlacing(true);
    try {
      const items = lines.map((l) => ({
        pid: l.product.id,
        name: l.product.name,
        cat: l.product.cat,
        shape: l.product.shape,
        size: l.product.size,
        unit: l.product.unit.replace('per ', ''),
        ct: l.qty,
        perCtPrice: l.product.price,
        lineTotal: l.product.price * l.qty,
      }));
      const order = await api.placeOrder({ items, source: 'Mobile App', status: 'pending' });
      clear();
      Alert.alert(
        'Order placed 🎉',
        `Order ${order.id} for ₹${(order.value || estTotal).toLocaleString('en-IN')} is in.\nYou'll get a dispatch update here soon.`,
        [{ text: 'View orders', onPress: () => navigation.navigate('Orders') }]
      );
    } catch (e: any) {
      Alert.alert('Could not place order', e.message || 'Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyBig}>Your cart is empty</Text>
        <Text style={styles.muted}>Browse the shop and add items to build an order.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.shopTxt}>Go to Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
        data={lines}
        keyExtractor={(l) => l.product.id}
        ListHeaderComponent={<Text style={styles.title}>Your cart</Text>}
        renderItem={({ item }) => <Line line={item} />}
      />
      <View style={styles.summary}>
        <View style={styles.sumRow}><Text style={styles.sumLabel}>Subtotal</Text><Text style={styles.sumVal}>₹{subtotal.toLocaleString('en-IN')}</Text></View>
        <View style={styles.sumRow}><Text style={styles.sumLabel}>GST (est. 3%)</Text><Text style={styles.sumVal}>₹{tax.toLocaleString('en-IN')}</Text></View>
        <View style={[styles.sumRow, { marginTop: 4 }]}><Text style={styles.totalLabel}>Estimated total</Text><Text style={styles.totalVal}>₹{estTotal.toLocaleString('en-IN')}</Text></View>
        <Text style={styles.note}>Final total (incl. shipping) is confirmed by our team on your invoice.</Text>
        <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={placing} activeOpacity={0.85}>
          {placing ? <ActivityIndicator color={theme.paper} /> : <Text style={styles.placeTxt}>Place order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, padding: 24 },
  emptyBig: { fontSize: 20, fontWeight: '700', color: theme.ink },
  muted: { color: theme.ink3, marginTop: 8, textAlign: 'center' },
  shopBtn: { marginTop: 18, backgroundColor: theme.emerald, borderRadius: 99, paddingHorizontal: 24, paddingVertical: 12 },
  shopTxt: { color: theme.paper, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '700', color: theme.ink, marginBottom: 8 },
  line: { flexDirection: 'row', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: theme.ink },
  meta: { color: theme.ink3, marginTop: 4, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 99, backgroundColor: theme.paper },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  stepTxt: { fontSize: 18, color: theme.emerald, fontWeight: '800' },
  qty: { minWidth: 70, textAlign: 'center', fontWeight: '700', color: theme.ink, fontSize: 12 },
  lineTotal: { fontWeight: '800', color: theme.ink, fontSize: 16 },
  remove: { color: '#8B1E2E', marginTop: 10, fontSize: 12, fontWeight: '600' },
  summary: { borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface, padding: 16, paddingBottom: 26 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sumLabel: { color: theme.ink3 },
  sumVal: { color: theme.ink2, fontWeight: '600' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.ink },
  totalVal: { fontSize: 18, fontWeight: '800', color: theme.ink },
  note: { color: theme.ink3, fontSize: 11, marginTop: 8, lineHeight: 16 },
  placeBtn: { marginTop: 14, backgroundColor: theme.emerald, borderRadius: 99, paddingVertical: 15, alignItems: 'center' },
  placeTxt: { color: theme.paper, fontWeight: '800', fontSize: 16 },
});
