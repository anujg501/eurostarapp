import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api, Customer } from '../api';
import { theme } from '../theme';

const TERMS = ['cash', '15', '30', '45', '60'] as const;

// Two-letter avatar from the customer's name.
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export default function CustomersScreen() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  // Add-customer form
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [terms, setTerms] = useState<(typeof TERMS)[number]>('cash');

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await api.customers());
    } catch (e: any) {
      setError(e.message || 'Could not load customers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.city || '').toLowerCase().includes(needle) ||
        (c.phone || '').includes(needle) ||
        (c.gstin || '').toLowerCase().includes(needle) ||
        c.code.toLowerCase().includes(needle)
    );
  }, [list, q]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setCity('');
    setGstin('');
    setTerms('cash');
  };

  const save = useCallback(async () => {
    if (!name.trim() || phone.trim().length < 6) {
      Alert.alert('Missing details', 'Please enter a name and a valid phone number.');
      return;
    }
    setSaving(true);
    try {
      const created = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        gstin: gstin.trim() || undefined,
        terms,
      });
      setShowAdd(false);
      resetForm();
      await load();
      Alert.alert('Customer added ✓', `${created.name} (${created.code}) is now in your book.`);
    } catch (e: any) {
      Alert.alert('Could not add customer', e.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, phone, city, gstin, terms, load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.emerald} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search name, city, phone, GST…"
          placeholderTextColor={theme.ink3}
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
        />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 96 }}
        data={filtered}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          <Text style={styles.count}>
            {filtered.length} {filtered.length === 1 ? 'customer' : 'customers'}
            {q ? ` matching “${q}”` : ' in your book'}
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.muted}>
            {error || (q ? 'No matches. Try a different search.' : 'No customers yet. Tap + to add your first.')}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials(item.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.code}
                {item.city ? ` · ${item.city}` : ''}
                {item.terms && item.terms !== 'cash' ? ` · ${item.terms}d terms` : ''}
              </Text>
              {item.gstin ? <Text style={styles.gst}>{item.gstin}</Text> : null}
            </View>
            {item.phone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Text style={styles.callTxt}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabTxt}>＋</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add customer</Text>

            <Text style={styles.label}>NAME *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Shop / firm name" placeholderTextColor={theme.ink3} />

            <Text style={styles.label}>PHONE *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91…" placeholderTextColor={theme.ink3} keyboardType="phone-pad" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CITY</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Rajkot" placeholderTextColor={theme.ink3} />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.label}>GST (optional)</Text>
                <TextInput style={styles.input} value={gstin} onChangeText={setGstin} placeholder="24ABC…" placeholderTextColor={theme.ink3} autoCapitalize="characters" />
              </View>
            </View>

            <Text style={styles.label}>PAYMENT TERMS</Text>
            <View style={styles.termsRow}>
              {TERMS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.termChip, terms === t && styles.termChipOn]}
                  onPress={() => setTerms(t)}
                >
                  <Text style={[styles.termTxt, terms === t && styles.termTxtOn]}>{t === 'cash' ? 'Cash' : `${t}d`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} disabled={saving}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color={theme.paper} /> : <Text style={styles.saveTxt}>Add customer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: theme.paper },
  search: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.ink,
  },
  count: { color: theme.ink3, fontSize: 13, marginBottom: 10, fontWeight: '600' },
  muted: { color: theme.ink3, marginTop: 24, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTxt: { color: theme.emeraldInk, fontWeight: '800', fontSize: 15 },
  name: { fontWeight: '700', color: theme.ink, fontSize: 16 },
  meta: { color: theme.ink3, fontSize: 12.5, marginTop: 2 },
  gst: { color: theme.ink3, fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  callBtn: {
    borderWidth: 1,
    borderColor: theme.emerald,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  callTxt: { color: theme.emeraldInk, fontWeight: '700', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabTxt: { color: theme.paper, fontSize: 30, fontWeight: '400', marginTop: -2 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 34,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, marginBottom: 14 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: theme.ink, marginBottom: 14 },
  label: { color: theme.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.ink,
  },
  termsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  termChip: { borderWidth: 1, borderColor: theme.border, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.surface },
  termChipOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  termTxt: { color: theme.ink2, fontWeight: '700', fontSize: 13 },
  termTxtOn: { color: theme.paper },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 99, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { color: theme.ink2, fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1.6, backgroundColor: theme.emerald, borderRadius: 99, paddingVertical: 14, alignItems: 'center' },
  saveTxt: { color: theme.paper, fontWeight: '800', fontSize: 15 },
});
