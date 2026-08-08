import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Category, type Product } from '../api';
import { theme } from '../theme';

// The shop front: who is signed in, then the categories they can order from,
// straight off /catalog. No baked-in copy of the catalogue — a category the
// office adds shows up here on the next refresh.
export default function HomeScreen({ navigation, onSignOut }: any) {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [who, setWho] = useState('');
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const [me, c, p] = await Promise.all([
        api.me().catch(() => null),
        api.catalog(),
        api.products().catch(() => ({ products: [] as Product[] })),
      ]);
      if (me) setWho(me.name);
      setCats(c.categories || []);
      setProducts(p.products || []);
    } catch (e: any) {
      setErr(e?.message || 'Could not load the catalogue.');
      setCats([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const countFor = (key: string) => products.filter((p) => p.cat === key).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Shop by category</Text>
            <Text style={styles.sub}>{who ? `Signed in as ${who}` : 'Eurostar wholesale'}</Text>
          </View>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.pillTxt}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={onSignOut}>
            <Text style={styles.pillTxt}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {cats === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(c) => c.key}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
          ListHeaderComponent={
            <Text style={styles.count}>{cats.length} product families · {products.length.toLocaleString('en-IN')} SKUs</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>No categories are published yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Category', { cat: item.key, name: item.name })}
            >
              <View style={styles.tileArt}>
                <Text style={styles.tileInitial}>{(item.short || item.name || '?').slice(0, 1)}</Text>
              </View>
              <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.tileMeta}>
                {countFor(item.key) ? `${countFor(item.key)} SKUs` : 'priced by size'}
                {item.unit ? ` · per ${item.unit}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  pill: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0 },
  pillTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },

  pad: { padding: 18, paddingBottom: 60, gap: 12, width: '100%', maxWidth: 620, alignSelf: 'center' },
  count: { fontSize: 12.5, color: theme.meta, marginBottom: 4 },

  tile: {
    flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 14, minHeight: 140,
  },
  tileArt: {
    height: 56, width: 56, borderRadius: 12, backgroundColor: theme.emeraldSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tileInitial: { fontSize: 22, fontWeight: '800', color: theme.emeraldInk },
  tileName: { fontSize: 14.5, fontWeight: '700', color: theme.ink, marginTop: 12 },
  tileMeta: { fontSize: 12, color: theme.meta, marginTop: 4 },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, paddingHorizontal: 18, paddingTop: 14 },
});
