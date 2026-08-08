import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Customer } from '../api';
import { theme } from '../theme';

const TERMS: Record<string, string> = { cash: 'Cash', '15': '15 days', '30': '30 days', '45': '45 days', '60': '60 days' };

// The customer book. A rep sees their own customers and office/admin see the
// whole master — that is the server's decision, made from the token, and this
// screen simply shows what came back.
export default function CustomersScreen({ navigation }: any) {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.customers()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setErr(e?.message || 'Could not load customers.'));
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows || [];
    return (rows || []).filter((c) =>
      [c.name, c.code, c.city, c.phone, c.gstin].filter(Boolean).some((v) => String(v).toLowerCase().includes(t))
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
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.sub}>{rows ? `${rows.length} on the book` : 'loading…'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={setQ}
          placeholder="Search name, code, city, phone…"
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
          keyExtractor={(c) => c.id || c.code}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>{q ? 'Nothing matches that search.' : 'No customers yet.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
              <Text style={styles.meta}>
                {[item.city, item.phone].filter(Boolean).join(' · ') || 'No city or phone on file'}
              </Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>{TERMS[item.terms || 'cash'] || item.terms}</Text>
                {!!item.gstin && <Text style={[styles.tag, styles.tagGst]} numberOfLines={1}>GST {item.gstin}</Text>}
              </View>
            </View>
          )}
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

  searchWrap: { paddingHorizontal: 18, paddingTop: 14, width: '100%', maxWidth: 620, alignSelf: 'center' },
  search: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.ink,
  },

  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.ink },
  code: { fontSize: 12, fontFamily: 'monospace', color: theme.emeraldInk, flexShrink: 0 },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tag: {
    fontSize: 11.5, fontWeight: '600', color: theme.ink2, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagGst: { maxWidth: 220 },
  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
