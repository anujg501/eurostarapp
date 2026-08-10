import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { api, type NewCustomer } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TERMS: NewCustomer['terms'][] = ['cash', '15', '30', '45', '60'];

// Add a shop to the book, from the shop floor. Same fields the web CRM's form
// carries, and the same server rules apply: a rep's new account is mapped to
// them automatically, and a GSTIN or mobile that already exists is refused with
// the name of whoever already holds it.
export default function AddCustomerScreen({ navigation }: any) {
  const [f, setF] = useState<NewCustomer>({ name: '', contact: '', phone: '', city: '', gstin: '', shipAddress: '', notes: '', terms: 'cash' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof NewCustomer) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const phoneOk = /^[6-9]\d{9}$/.test((f.phone || '').replace(/\D/g, ''));
  const canSave = f.name.trim().length > 1 && phoneOk;

  const save = async () => {
    if (!canSave) {
      Alert.alert('Missing details', 'A company name and a 10-digit mobile number are needed.');
      return;
    }
    setBusy(true);
    try {
      const c = await api.addCustomer({
        ...f,
        name: f.name.trim(),
        phone: (f.phone || '').replace(/\D/g, ''),
        contact: f.contact?.trim() || undefined,
        city: f.city?.trim() || undefined,
        gstin: f.gstin?.trim().toUpperCase() || undefined,
        shipAddress: f.shipAddress?.trim() || undefined,
        notes: f.notes?.trim() || undefined,
      });
      Alert.alert('Customer added', `${c.name} is on your book as ${c.code}.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      // The server answers a duplicate with 409 and a sentence naming the
      // existing account — show that sentence rather than a generic failure.
      Alert.alert(e?.status === 409 ? 'Already on the books' : 'Could not add that customer',
        e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead title="Add customer" sub="New account on your book" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Field label="COMPANY / FIRM NAME" value={f.name} onChange={set('name')} placeholder="Shree Ganesh Jewellers" autoFocus />
          <Field label="CONTACT PERSON" value={f.contact || ''} onChange={set('contact')} placeholder="Who you deal with" />

          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.cc}><Text style={styles.ccTxt}>+91</Text></View>
            <TextInput
              style={[styles.ipt, { flex: 1 }]}
              value={f.phone}
              onChangeText={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="9820000000"
              placeholderTextColor={theme.meta}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          {!!f.phone && !phoneOk && <Text style={styles.warn}>That is not a 10-digit Indian mobile number.</Text>}

          <Field label="CITY" value={f.city || ''} onChange={set('city')} placeholder="Mumbai" />
          <Field label="GSTIN" value={f.gstin || ''} onChange={set('gstin')} placeholder="27AAAAA0000A1Z5" autoCapitalize="characters" />
          <Field label="SHOP / DELIVERY ADDRESS" value={f.shipAddress || ''} onChange={set('shipAddress')} placeholder="Street, area, landmark" multiline />
          <Field label="SPECIAL NOTES" value={f.notes || ''} onChange={set('notes')} placeholder="Anything the office should know" multiline />

          <Text style={styles.label}>PAYMENT TERMS</Text>
          <View style={styles.terms}>
            {TERMS.map((t) => {
              const on = f.terms === t;
              return (
                <TouchableOpacity key={t} style={[styles.term, on && styles.termOn]} onPress={() => setF((s) => ({ ...s, terms: t }))}>
                  <Text style={[styles.termTxt, on && styles.termTxtOn]}>{t === 'cash' ? 'Cash' : `${t} days`}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.save, (!canSave || busy) && { opacity: 0.55 }]} onPress={save} disabled={!canSave || busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Add customer</Text>}
          </TouchableOpacity>
          <Text style={styles.foot}>
            The same shop cannot be added twice — the office keys the master on GSTIN and mobile number.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline, autoCapitalize, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; autoCapitalize?: any; autoFocus?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.ipt, multiline && { height: 76, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.meta}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 70, width: '100%', maxWidth: 620, alignSelf: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: theme.ink,
  },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  cc: {
    justifyContent: 'center', paddingHorizontal: 14, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
  },
  ccTxt: { fontSize: 15, fontWeight: '600', color: theme.ink2 },
  warn: { fontSize: 12, color: theme.ruby, marginTop: 6 },

  terms: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  term: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  termOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  termTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2 },
  termTxtOn: { color: '#fff', fontWeight: '700' },

  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  foot: { fontSize: 12, color: theme.meta, marginTop: 14, lineHeight: 18, textAlign: 'center' },
});
