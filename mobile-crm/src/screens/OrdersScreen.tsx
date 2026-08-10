import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api, type Order } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

// Colour tells the state at a glance, the way the web CRM's pills do.
const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FCEBC8', fg: '#8A6314' },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  packed: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  shipped: { bg: '#E7EEF7', fg: '#1F3350' },
  delivered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  cancelled: { bg: theme.rubySoft, fg: theme.ruby },
};

const FILTERS = ['all', 'pending', 'confirmed', 'shipped', 'delivered'] as const;

export default function OrdersScreen({ navigation, role = 'rep', active = true, onCounts }: any) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    if (!active) return;
    api.orders()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setErr(e?.message || 'Could not load orders.'));
  }, [active]);

  const pending = (rows || []).filter((o) => o.status === 'pending').length;
  useEffect(() => { if (rows) onCounts?.({ Orders: pending }); }, [onCounts, rows, pending]);

  const list = useMemo(
    () => (filter === 'all' ? rows || [] : (rows || []).filter((o) => o.status === filter)),
    [rows, filter]
  );
  const value = list.reduce((s, o) => s + (o.grand || 0), 0);

  const when = (o: Order) => {
    const raw = o.date || o.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    // A missing or unparseable date must never print "Invalid Date" at staff.
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title={role === 'rep' ? 'Orders' : 'Order desk'}
        sub={rows ? `${list.length} shown · ${money(value)}` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipOn]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipTxt, filter === f && styles.chipTxtOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Nothing here.</Text>}
          renderItem={({ item }) => {
            const tone = TONE[item.status] || { bg: theme.card, fg: theme.ink2 };
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.custName || item.customerName || item.customer || 'Customer'}
                  </Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{item.status}</Text>
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.meta}>{item.id}{when(item) ? ` · ${when(item)}` : ''}</Text>
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
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 14, flexWrap: 'wrap', width: '100%', maxWidth: 620, alignSelf: 'center' },
  chip: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: theme.surface },
  chipOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  chipTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, textTransform: 'capitalize' },
  chipTxtOn: { color: '#fff' },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.ink },
  pill: { fontSize: 11.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', textTransform: 'capitalize', flexShrink: 0 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  meta: { flex: 1, fontSize: 12, color: theme.meta },
  amount: { fontSize: 15, fontWeight: '700', color: theme.emeraldInk, flexShrink: 0 },
  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
