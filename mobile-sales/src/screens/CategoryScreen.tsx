import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Product } from '../api';
import { theme } from '../theme';

const money = (n: number) => `₹${n < 100 ? Number(n.toFixed(2)) : Math.round(n).toLocaleString('en-IN')}`;

const STOCK: Record<string, { label: string; bg: string; fg: string }> = {
  in: { label: 'In stock', bg: theme.emeraldSoft, fg: theme.emeraldInk },
  low: { label: 'Low', bg: '#FCEBC8', fg: '#8A6314' },
  out: { label: 'Sold out', bg: theme.rubySoft, fg: theme.ruby },
};

// What this category actually sells, at today's published rate. Prices come
// from the same catalogue the website reads, so a change in Admin shows here on
// the next open — there is no second price list in the app.
export default function CategoryScreen({ route, navigation }: any) {
  const { cat, name } = route.params as { cat: string; name: string };
  const [rows, setRows] = useState<Product[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.products()
      .then((r) => setRows((r.products || []).filter((p) => p.cat === cat)))
      .catch((e) => setErr(e?.message || 'Could not load this category.'));
  }, [cat]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows || [];
    return (rows || []).filter((p) =>
      [p.name, p.shape, p.size, p.tone].filter(Boolean).some((v) => String(v).toLowerCase().includes(t))
    );
  }, [rows, q]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Text style={styles.backTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.sub}>{rows ? `${list.length} of ${rows.length} SKUs` : 'loading…'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={setQ}
          placeholder="Search shape, size, colour…"
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
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {q ? 'Nothing matches that search.' : 'This category is priced by size on the website rather than as fixed SKUs.'}
            </Text>
          }
          renderItem={({ item }) => {
            const s = STOCK[item.stock || 'in'] || STOCK.in;
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.pill, { backgroundColor: s.bg, color: s.fg }]}>{s.label}</Text>
                </View>
                <Text style={styles.meta}>
                  {[item.shape, item.size, item.tone].filter(Boolean).join(' · ') || 'Calibrated stock'}
                </Text>
                <View style={styles.cardFoot}>
                  <Text style={styles.price}>{money(item.price)}<Text style={styles.per}> / {item.unit || 'pc'}</Text></Text>
                  {!!item.moq && item.moq > 1 && <Text style={styles.moq}>min {item.moq.toLocaleString('en-IN')}</Text>}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  back: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backTxt: { fontSize: 22, color: theme.ink, marginTop: -3 },
  title: { fontSize: 17, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },

  searchWrap: { paddingHorizontal: 18, paddingTop: 14, width: '100%', maxWidth: 620, alignSelf: 'center' },
  search: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.ink,
  },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: { fontSize: 11, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden', flexShrink: 0 },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },
  cardFoot: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10 },
  price: { fontSize: 17, fontWeight: '800', color: theme.emeraldInk },
  per: { fontSize: 12, fontWeight: '600', color: theme.meta },
  moq: { fontSize: 12, color: theme.meta },
  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, lineHeight: 20 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
