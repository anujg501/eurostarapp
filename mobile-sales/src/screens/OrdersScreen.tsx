import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Order } from '../api';
import { theme } from '../theme';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FCEBC8', fg: '#8A6314' },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  packed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  shipped: { bg: '#E7EEF7', fg: '#1F3350' },
  delivered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { bg: theme.rubySoft, fg: theme.ruby },
};

// The customer's own orders — the server scopes this to the signed-in account,
// so the app does not filter anything itself.
export default function OrdersScreen({ navigation }: any) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.orders()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setErr(e?.message || 'Could not load your orders.'));
  }, []);

  const when = (o: Order) => {
    const raw = o.date || o.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    // Never print "Invalid Date" at a customer.
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Text style={styles.backTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your orders</Text>
            <Text style={styles.sub}>{rows ? `${rows.length} order${rows.length === 1 ? '' : 's'}` : 'loading…'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>You have not placed an order yet.</Text>}
          renderItem={({ item }) => {
            const tone = TONE[item.status] || { bg: theme.card, fg: theme.ink2 };
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.id}>{item.id}</Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{item.status}</Text>
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.meta}>{when(item)}</Text>
                  <Text style={styles.amount}>{money(item.grand)}</Text>
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
  title: { fontSize: 18, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  id: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.ink, fontFamily: 'monospace' },
  pill: { fontSize: 11.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', textTransform: 'capitalize', flexShrink: 0 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  meta: { flex: 1, fontSize: 12.5, color: theme.meta },
  amount: { fontSize: 15, fontWeight: '700', color: theme.emeraldInk, flexShrink: 0 },
  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
