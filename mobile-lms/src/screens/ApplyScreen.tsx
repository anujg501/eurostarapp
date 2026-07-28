import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../theme';
import { useCandidate } from '../state';

const EXP = ['Fresher', '0–1 yr', '1–3 yrs', '3+ yrs'];
const SOURCE = ['Referral', 'Job portal', 'Social media', 'Walk-in'];

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <TouchableOpacity key={o} style={[styles.chip, value === o && styles.chipOn]} onPress={() => onChange(o)}>
          <Text style={[styles.chipTxt, value === o && styles.chipTxtOn]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ApplyScreen({ navigation }: any) {
  const { cand, submitApplication } = useCandidate();
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [exp, setExp] = useState('');
  const [source, setSource] = useState('');

  if (cand.applied) {
    return (
      <View style={styles.doneWrap}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>Application submitted</Text>
        <Text style={styles.doneSub}>Our team will review it. Meanwhile, start your training.</Text>
        <TouchableOpacity style={styles.cta} onPress={() => navigation.replace('Training')}>
          <Text style={styles.ctaTxt}>Go to Training →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function submit() {
    if (mobile.replace(/\D/g, '').length < 10) { Alert.alert('Enter a valid mobile number'); return; }
    if (!email.trim() || !city.trim() || !state.trim() || !exp || !source) {
      Alert.alert('Please fill all required fields'); return;
    }
    submitApplication();
    Alert.alert('Submitted', 'Your application has been received.', [
      { text: 'Start training', onPress: () => navigation.replace('Training') },
    ]);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
        <View style={styles.headCard}>
          <Text style={styles.headTitle}>Apply — Field Sales Representative</Text>
          <Text style={styles.headSub}>Fill in your details to begin. Fields marked * are required.</Text>
        </View>

        <Field label="Mobile Number *"><TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} placeholder="10-digit mobile" placeholderTextColor={theme.meta} /></Field>
        <Field label="Email Address *"><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={theme.meta} /></Field>
        <Field label="City *"><TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Surat" placeholderTextColor={theme.meta} /></Field>
        <Field label="State *"><TextInput style={styles.input} value={state} onChangeText={setState} placeholder="e.g. Gujarat" placeholderTextColor={theme.meta} /></Field>
        <Field label="Experience *"><Chips options={EXP} value={exp} onChange={setExp} /></Field>
        <Field label="How did you hear about us? *"><Chips options={SOURCE} value={source} onChange={setSource} /></Field>

        <TouchableOpacity style={styles.cta} onPress={submit}>
          <Text style={styles.ctaTxt}>Submit application</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headCard: { backgroundColor: theme.purpleSoft, borderRadius: theme.radius.lg, padding: 16, marginBottom: 18 },
  headTitle: { fontSize: 16, fontWeight: '800', color: theme.purpleInk },
  headSub: { fontSize: 12.5, color: theme.purpleInk, marginTop: 4, opacity: 0.85 },
  label: { fontSize: 12, fontWeight: '700', color: theme.meta, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: { backgroundColor: theme.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: theme.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.surface },
  chipOn: { backgroundColor: theme.purple, borderColor: theme.purple },
  chipTxt: { color: theme.ink2, fontWeight: '600', fontSize: 13 },
  chipTxtOn: { color: '#fff' },
  cta: { backgroundColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  doneIcon: { fontSize: 54 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 14 },
  doneSub: { fontSize: 14, color: theme.meta, textAlign: 'center', marginTop: 8 },
});
