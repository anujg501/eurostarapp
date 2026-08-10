import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { api, type Rfq } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number | null) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

const TONE: Record<string, { bg: string; fg: string }> = {
  open: { bg: theme.amberSoft, fg: theme.amber },
  answered: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  quoted: { bg: theme.emeraldSoft, fg: theme.emeraldInk },
  closed: { bg: theme.card, fg: theme.meta },
};

// Enquiries raised from the storefront. The office routes each one to a rep;
// a rep's list is therefore what has been put on their name, plus anything
// still unassigned that they could pick up.
export default function RfqScreen({ navigation, route, active = true, onCounts }: any) {
  const role: string = route?.params?.role || 'rep';
  const repId: string | undefined = route?.params?.repId;
  const [rows, setRows] = useState<Rfq[] | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'mine' | 'open' | 'all'>(role === 'rep' ? 'mine' : 'open');

  const load = useCallback(() => {
    api.rfqs()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setErr(e?.message || 'Could not load enquiries.'); setRows([]); });
  }, []);

  useEffect(() => { if (active) load(); }, [active, load]);

  const mine = useMemo(
    () => (rows || []).filter((r) => !!repId && r.assignedRep === repId),
    [rows, repId]
  );

  const list = useMemo(() => {
    if (!rows) return [];
    if (tab === 'mine') return mine;
    if (tab === 'open') return rows.filter((r) => r.status === 'open');
    return rows;
  }, [rows, tab, mine]);

  const openCount = (rows || []).filter((r) => r.status === 'open').length;

  useEffect(() => { if (rows) onCounts?.({ Rfq: openCount }); }, [onCounts, rows, openCount]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title={role === 'rep' ? 'My RFQs' : 'RFQ Enquiries'}
        sub={rows ? `${list.length} shown · ${openCount} open` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {([
          ...(role === 'rep' ? [{ k: 'mine' as const, label: `On my name (${mine.length})` }] : []),
          { k: 'open' as const, label: `Open (${openCount})` },
          { k: 'all' as const, label: `All (${(rows || []).length})` },
        ]).map((t) => {
          const on = tab === t.k;
          return (
            <TouchableOpacity key={t.k} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t.k)}>
              <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{t.label}</Text>
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
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'mine'
                ? 'No enquiries have been routed to you yet.'
                : 'No enquiries here.'}
            </Text>
          }
          renderItem={({ item }) => {
            const tone = TONE[item.status] || TONE.closed;
            const d = item.detail || {};
            const want = [d.product, d.size, d.quality].filter(Boolean).join(' · ');
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.custName || d.contactName || 'Enquiry'}
                  </Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{item.status}</Text>
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.custCode, item.city].filter(Boolean).join(' · ') || item.id}
                </Text>
                {!!want && <Text style={styles.want} numberOfLines={2}>{want}</Text>}
                {!!d.qty && <Text style={styles.meta}>Quantity requested: {d.qty}</Text>}
                {/* The desktop lists the special note and who to ring — the two
                    things a rep needs before picking up the phone. */}
                {!!d.special && <Text style={styles.note} numberOfLines={2}>{d.special}</Text>}
                {(d.contactName || d.contact) && (
                  <View style={styles.contactRow}>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[d.contactName, d.contact].filter(Boolean).join(' · ')}
                    </Text>
                    {!!d.contact && (
                      <TouchableOpacity style={styles.call} onPress={() => Linking.openURL(`tel:${d.contact}`)}>
                        <Text style={styles.callTxt}>📞 Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.foot}>
                  <Text style={styles.metaSmall}>
                    {item.assignedRep ? `Routed to ${item.assignedRep}` : 'Not yet routed'}
                  </Text>
                  <Text style={styles.amount}>
                    {item.quoteAmount ? `Quoted ${money(item.quoteAmount)}` : money(item.value)}
                  </Text>
                </View>
                {!!item.quoteNote && <Text style={styles.note} numberOfLines={2}>{item.quoteNote}</Text>}
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
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 11, fontWeight: '700', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden', flexShrink: 0, textTransform: 'capitalize',
  },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 4 },
  metaSmall: { flex: 1, fontSize: 12, color: theme.meta },
  want: { fontSize: 13, color: theme.ink2, marginTop: 6, fontWeight: '600' },
  note: { fontSize: 12.5, color: theme.meta, marginTop: 6, fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  call: { backgroundColor: theme.emerald, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0 },
  callTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  foot: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10 },
  amount: { fontSize: 15, fontWeight: '800', color: theme.emeraldInk, flexShrink: 0 },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
