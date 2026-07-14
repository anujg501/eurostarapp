import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../api';
import { theme } from '../theme';

type Category = { key: string; name: string; short: string; blurb: string; unit: string; count: number };

const UNIT_LABEL: Record<string, string> = { pc: 'per piece', ct: 'per carat', pkt: 'per packet', strip: 'per strip' };

export default function HomeScreen({ navigation }: any) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api.catalog();
      setCats(data.categories || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.emerald} size="large" />
        <Text style={styles.muted}>Loading catalogue…</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.paper }}
      contentContainerStyle={{ padding: 16 }}
      data={cats}
      keyExtractor={(c) => c.key}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Shop by category</Text>
          <Text style={styles.muted}>{cats.length} categories · calibrated, certified, delivered</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Products', { cat: item.key, name: item.name })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.unitPill}>
              <Text style={styles.unitText}>{UNIT_LABEL[item.unit] || item.unit}</Text>
            </View>
          </View>
          <Text style={styles.cardBlurb} numberOfLines={2}>{item.blurb}</Text>
          <View style={styles.cardTop}>
            {item.count ? <Text style={styles.cardCount}>{item.count.toLocaleString('en-IN')} SKUs</Text> : <View />}
            <Text style={styles.cardCta}>Shop →</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  title: { fontSize: 24, fontWeight: '700', color: theme.ink },
  muted: { color: theme.ink3, marginTop: 4 },
  error: { color: '#8B1E2E', marginTop: 8 },
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.lg,
    padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 18, fontWeight: '700', color: theme.ink, flex: 1, paddingRight: 8 },
  unitPill: { backgroundColor: theme.emeraldSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  unitText: { color: theme.emeraldInk, fontSize: 11, fontWeight: '700' },
  cardBlurb: { color: theme.ink3, marginTop: 8, lineHeight: 20 },
  cardCount: { color: theme.ink3, marginTop: 10, fontWeight: '600', fontSize: 12 },
  cardCta: { color: theme.emerald, marginTop: 10, fontWeight: '800', fontSize: 13 },
});
