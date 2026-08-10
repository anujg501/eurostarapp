import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { api, type Cart, type Customer } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const BIG = 100000; // the desktop calls a cart "big" at ₹1,00,000

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  'quote-requested': { bg: theme.amberSoft, fg: theme.amber, label: 'Quote requested' },
  abandoned: { bg: theme.rubySoft, fg: theme.ruby, label: 'Abandoned' },
  active: { bg: theme.emeraldSoft, fg: theme.emeraldInk, label: 'Open' },
};

const ago = (iso?: string) => {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(d / 3600000);
  return hrs > 0 ? `${hrs}h ago` : 'just now';
};

/**
 * Carts — money that got as far as the basket and stopped.
 *
 * Two queues the office works: customers who asked for a price and are waiting,
 * and high-value carts left unpaid. Both are worth a phone call, so every row
 * carries the customer's number rather than making the office go and look it up.
 */
export default function CartsScreen({ navigation, active = true, onCounts }: any) {
  const [rows, setRows] = useState<Cart[] | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'quote' | 'abandoned' | 'all'>('quote');

  const load = () => {
    api.carts().then((c) => setRows(Array.isArray(c) ? c : [])).catch((e) => {
      setErr(e?.message || 'Could not load carts.');
      setRows([]);
    });
    api.customers().then((c) => setCustomers(Array.isArray(c) ? c : [])).catch(() => {});
  };
  useEffect(() => { if (active) load(); }, [active]);

  const quotes = (rows || []).filter((c) => c.status === 'quote-requested');
  const abandoned = (rows || []).filter((c) => c.status === 'abandoned');
  const bigAbandoned = abandoned.filter((c) => (c.totals?.grand || 0) >= BIG);

  useEffect(() => {
    if (rows) onCounts?.({ Carts: quotes.length + bigAbandoned.length });
  }, [onCounts, rows, quotes.length, bigAbandoned.length]);

  const list = useMemo(() => {
    if (tab === 'quote') return quotes;
    if (tab === 'abandoned') return abandoned;
    return rows || [];
  }, [rows, tab, quotes, abandoned]);

  const custOf = (c: Cart) => customers.find((x) => x.id === c.customerId);

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Carts"
        sub={rows ? `${quotes.length} awaiting a quote · ${abandoned.length} abandoned` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {([
          ['quote', `Quote requests (${quotes.length})`],
          ['abandoned', `Abandoned (${abandoned.length})`],
          ['all', `All (${(rows || []).length})`],
        ] as const).map(([k, label]) => {
          const on = tab === k;
          return (
            <TouchableOpacity key={k} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(k)}>
              <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            tab === 'abandoned' && bigAbandoned.length > 0 ? (
              <View style={styles.alert}>
                <Text style={styles.alertTitle}>
                  {bigAbandoned.length} high-value cart{bigAbandoned.length > 1 ? 's' : ''} ·{' '}
                  {money(bigAbandoned.reduce((s, c) => s + (c.totals?.grand || 0), 0))}
                </Text>
                <Text style={styles.alertSub}>Over {money(BIG)} and left unpaid. Have the rep call and recover them.</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'quote'
                ? 'No carts waiting on a quote.'
                : tab === 'abandoned'
                  ? 'No abandoned carts — nothing to recover.'
                  : 'No carts yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const tone = TONE[item.status] || TONE.active;
            const cu = custOf(item);
            const big = item.status === 'abandoned' && (item.totals?.grand || 0) >= BIG;
            return (
              <View style={[styles.card, big && { borderColor: theme.rubyBorder }]}>
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>{cu?.name || 'Customer'}</Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{tone.label}</Text>
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[cu?.code, cu?.city, ago(item.updatedAt)].filter(Boolean).join(' · ')}
                </Text>

                <View style={styles.foot}>
                  <Text style={styles.amount}>{money(item.totals?.grand)}</Text>
                  {!!cu?.phone && (
                    <>
                      <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`tel:${cu.phone}`)}>
                        <Text style={styles.btnTxt}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ghost}
                        onPress={() => Linking.openURL(`https://wa.me/91${String(cu.phone).replace(/\D/g, '').slice(-10)}`)}
                      >
                        <Text style={styles.ghostTxt}>WhatsApp</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
  tabs: { flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingVertical: 12, flexWrap: 'wrap' },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  tabOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  tabTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  tabTxtOn: { color: '#fff', fontWeight: '700' },

  pad: { paddingHorizontal: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  alert: {
    backgroundColor: theme.rubySoft, borderWidth: 1, borderColor: theme.rubyBorder,
    borderRadius: 12, padding: 13, marginBottom: 12,
  },
  alertTitle: { fontSize: 13.5, fontWeight: '700', color: theme.ruby },
  alertSub: { fontSize: 12.5, color: theme.ruby, marginTop: 3, opacity: 0.9, lineHeight: 18 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
    overflow: 'hidden', flexShrink: 0,
  },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  amount: { flex: 1, fontSize: 17, fontWeight: '800', color: theme.emeraldInk },

  btn: { backgroundColor: theme.emerald, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 8 },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12, fontWeight: '700' },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, paddingHorizontal: 24, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
