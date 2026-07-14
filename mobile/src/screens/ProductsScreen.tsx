import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api, Product } from '../api';
import { theme } from '../theme';
import { useCart } from '../cart';

const UNIT_LABEL: Record<string, string> = {
  'per pc': 'pc', 'per strand': 'strand', 'per set': 'set', 'per strip': 'strip', 'per packet': 'pkt',
};
const STOCK_LABEL: Record<string, string> = { in: 'In stock', low: 'Low stock', out: 'Out of stock' };
const STOCK_COLOR: Record<string, string> = { in: theme.emerald, low: '#B4802A', out: '#8B1E2E' };

function ProductRow({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(product.moq);
  const [added, setAdded] = useState(false);
  const step = product.moq >= 100 ? 50 : product.moq >= 20 ? 10 : product.moq >= 6 ? 2 : 1;
  const unit = UNIT_LABEL[product.unit] || product.unit;
  const soldOut = product.stock === 'out';

  const dec = () => setQty((q) => Math.max(product.moq, q - step));
  const inc = () => setQty((q) => q + step);

  const onAdd = () => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.name}>{product.name}</Text>
        {product.badge ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{product.badge}</Text></View>
        ) : null}
      </View>
      <Text style={styles.meta}>
        {product.shape} · {product.size} · {product.clarity}
      </Text>
      {product.desc ? <Text style={styles.desc} numberOfLines={2}>{product.desc}</Text> : null}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
        <Text style={styles.unit}> /{unit}</Text>
        <Text style={[styles.stock, { color: STOCK_COLOR[product.stock] }]}>· {STOCK_LABEL[product.stock]}</Text>
      </View>
      <Text style={styles.moq}>Min. order {product.moq.toLocaleString('en-IN')} {unit}</Text>

      <View style={styles.actionRow}>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={dec} style={styles.stepBtn} disabled={soldOut}>
            <Text style={styles.stepTxt}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{qty.toLocaleString('en-IN')}</Text>
          <TouchableOpacity onPress={inc} style={styles.stepBtn} disabled={soldOut}>
            <Text style={styles.stepTxt}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onAdd}
          disabled={soldOut}
          style={[styles.addBtn, (added || soldOut) && styles.addBtnAlt]}
          activeOpacity={0.85}
        >
          <Text style={[styles.addTxt, (added || soldOut) && styles.addTxtAlt]}>
            {soldOut ? 'Sold out' : added ? '✓ Added' : `Add · ₹${(product.price * qty).toLocaleString('en-IN')}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ProductsScreen({ route }: any) {
  const cat: string = route?.params?.cat;
  const catName: string = route?.params?.name || 'Products';
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api.products(cat);
      setItems(data.products || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [cat]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.emerald} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.paper }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 6 }}>
          <Text style={styles.title}>{catName}</Text>
          <Text style={styles.subtle}>{items.length} item{items.length === 1 ? '' : 's'} · tap Add to build your order</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.subtle}>{error || 'No items in this category yet.'}</Text>}
      renderItem={({ item }) => <ProductRow product={item} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  title: { fontSize: 22, fontWeight: '700', color: theme.ink },
  subtle: { color: theme.ink3, marginTop: 4 },
  error: { color: '#8B1E2E', marginTop: 8 },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.lg, padding: 16, marginTop: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 17, fontWeight: '700', color: theme.ink, flex: 1, paddingRight: 8 },
  badge: { backgroundColor: theme.emeraldSoft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: theme.emeraldInk, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { color: theme.ink3, marginTop: 6, textTransform: 'capitalize' },
  desc: { color: theme.ink2, marginTop: 6, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, flexWrap: 'wrap' },
  price: { fontSize: 20, fontWeight: '800', color: theme.ink },
  unit: { color: theme.ink3, fontWeight: '600' },
  stock: { marginLeft: 8, fontWeight: '700', fontSize: 12 },
  moq: { color: theme.ink3, marginTop: 4, fontSize: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 99, backgroundColor: theme.paper },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  stepTxt: { fontSize: 20, color: theme.emerald, fontWeight: '800' },
  qty: { minWidth: 48, textAlign: 'center', fontWeight: '700', color: theme.ink },
  addBtn: { flex: 1, backgroundColor: theme.emerald, borderRadius: 99, paddingVertical: 12, alignItems: 'center' },
  addBtnAlt: { backgroundColor: theme.emeraldSoft },
  addTxt: { color: theme.paper, fontWeight: '800' },
  addTxtAlt: { color: theme.emeraldInk },
});
