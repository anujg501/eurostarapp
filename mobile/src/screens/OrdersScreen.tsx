import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../api';
import { theme } from '../theme';

type Order = { id: string; customer: string; value: number; status: string; dispatchBy?: string; paid?: boolean };

const STATUS_COLOR: Record<string, string> = {
  pending: '#B4802A', confirmed: theme.emerald, packed: '#5B7BC4', shipped: '#0E5C4A', delivered: '#3E8E4F', cancelled: '#8B1E2E',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setOrders(await api.myOrders());
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
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.paper }}
      contentContainerStyle={{ padding: 16 }}
      data={orders}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={<Text style={styles.title}>Your orders</Text>}
      ListEmptyComponent={
        <Text style={styles.muted}>{error || 'No orders yet. Browse the catalogue to place your first order.'}</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.oid}>{item.id}</Text>
            <Text style={[styles.status, { color: STATUS_COLOR[item.status] || theme.ink3 }]}>{item.status}</Text>
          </View>
          <Text style={styles.cust}>{item.customer}</Text>
          <View style={styles.row}>
            <Text style={styles.value}>₹{(item.value || 0).toLocaleString('en-IN')}</Text>
            {item.dispatchBy ? <Text style={styles.muted}>Dispatch {item.dispatchBy}</Text> : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  title: { fontSize: 24, fontWeight: '700', color: theme.ink, marginBottom: 12 },
  muted: { color: theme.ink3, marginTop: 8 },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.lg, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oid: { fontWeight: '700', color: theme.ink, fontFamily: 'monospace' },
  status: { fontWeight: '700', textTransform: 'capitalize' },
  cust: { color: theme.ink2, marginTop: 6, fontSize: 15 },
  value: { fontSize: 18, fontWeight: '700', color: theme.ink, marginTop: 8 },
});
