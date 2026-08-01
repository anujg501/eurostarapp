import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { api, type Candidate } from '../api';
import { theme } from '../theme';

// What a hired candidate completes before their Sales App login goes live.
// The web candidate flow has always had this screen; on the phone there was
// nothing after "hired" at all — no Rep ID, no password, no undertaking to
// sign and nowhere to file bank details. Same four steps as the web, and the
// same records on the pipeline row, so the office sees one set of answers.
export default function OnboardingScreen({ navigation }: any) {
  const [cand, setCand] = useState<Candidate | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCand(await api.myCandidate());
    } catch (e: any) {
      setErr(e?.message || 'Could not load your onboarding.');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ob = cand?.onboarding || {};
  const [bank, setBank] = useState({ holder: '', acc: '', accConfirm: '', bankName: '', ifsc: '' });
  useEffect(() => {
    if (ob.bank) setBank({ ...ob.bank, accConfirm: ob.bank.acc });
    else if (cand?.name) setBank((b) => (b.holder ? b : { ...b, holder: cand.name }));
  }, [cand]);

  const sign = async () => {
    setBusy('sign');
    try { setCand(await api.saveOnboarding({ confidentiality: true })); }
    catch (e: any) { Alert.alert('Could not save', e?.message || 'Try again.'); }
    finally { setBusy(null); }
  };

  const saveBank = async () => {
    if (!bank.holder.trim() || !bank.bankName.trim()) { Alert.alert('Enter the account-holder name and bank name'); return; }
    if (bank.acc.length < 8 || bank.acc !== bank.accConfirm) { Alert.alert('Account numbers must match and be at least 8 digits'); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc.toUpperCase())) { Alert.alert('Enter a valid IFSC code', 'For example HDFC0001234.'); return; }
    setBusy('bank');
    try {
      setCand(await api.saveOnboarding({
        bank: { holder: bank.holder.trim(), acc: bank.acc, bankName: bank.bankName.trim(), ifsc: bank.ifsc.toUpperCase() },
      }));
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally { setBusy(null); }
  };

  const pickDoc = async (kind: 'photo' | 'aadhaar' | 'pan') => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const f = res.assets[0];
    setBusy(kind);
    try {
      setCand(await api.uploadOnboardingDoc(kind, {
        uri: f.uri,
        name: f.name || `${kind}.jpg`,
        mimeType: f.mimeType || 'image/jpeg',
      }));
    } catch (e: any) {
      Alert.alert('Could not upload', e?.message || 'Try again.');
    } finally { setBusy(null); }
  };

  const done = !!(ob.confidentiality && ob.photo && ob.aadhaarImg && ob.bank);

  const Appbar = (
    <SafeAreaView edges={['top']} style={styles.appbarWrap}>
      <View style={styles.appbar}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Feather name="chevron-left" size={20} color={theme.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Onboarding</Text>
          {!!cand?.repId && <Text style={styles.sub}>{cand.repId}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );

  if (!cand) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        {Appbar}
        <View style={styles.center}>
          {err ? <Text style={styles.centerTxt}>{err}</Text> : <ActivityIndicator color={theme.purple} size="large" />}
        </View>
      </View>
    );
  }

  // Not hired yet — say so rather than showing a form that cannot be saved.
  if (cand.stage !== 'hired' && !cand.repId) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        {Appbar}
        <View style={styles.center}>
          <Text style={{ fontSize: 34 }}>📋</Text>
          <Text style={[styles.centerTxt, { marginTop: 12 }]}>
            Onboarding opens once the office has hired you. You'll be notified here when it does.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      {Appbar}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.card, done ? styles.cardDone : styles.cardInfo]}>
            <Text style={[styles.cardTxt, done && { color: theme.greenInk }]}>
              {done
                ? '✓ All details submitted. Your Sales App login is active — sign in with your Rep ID.'
                : 'Complete these steps to activate your Sales App account.'}
            </Text>
          </View>

          {/* The credentials issued on hire — the whole point of this screen. */}
          <View style={styles.creds}>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Rep ID</Text>
              <Text style={styles.credValue}>{cand.repId || '—'}</Text>
            </View>
            {!!cand.tempPassword && (
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Temporary password</Text>
                <Text style={styles.credValue}>{cand.tempPassword}</Text>
              </View>
            )}
            <Text style={styles.credNote}>
              This is your Sales App username. Change the password after your first sign-in.
            </Text>
          </View>

          <Text style={styles.sec}>1 · Confidentiality agreement</Text>
          <View style={styles.quote}>
            <Text style={styles.quoteTxt}>
              I agree that all prices, product data, training material and customer information are the property of
              Eurostar, and that sharing, copying or forwarding any of it to outsiders is strictly prohibited and will
              lead to termination and legal action.
            </Text>
          </View>
          {ob.confidentiality ? (
            <Text style={styles.ok}>✓ Signed &amp; recorded</Text>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={sign} disabled={busy === 'sign'}>
              <Text style={styles.btnTxt}>{busy === 'sign' ? 'Saving…' : 'I agree & sign'}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sec}>2 · Your photograph</Text>
          <DocRow label="Passport photo" hint="A clear front-facing photo" done={!!ob.photo}
            busy={busy === 'photo'} onPick={() => pickDoc('photo')} />

          <Text style={styles.sec}>3 · Identity documents</Text>
          <DocRow label="Aadhaar card" hint="Photo of your Aadhaar card" done={!!ob.aadhaarImg}
            busy={busy === 'aadhaar'} onPick={() => pickDoc('aadhaar')} />
          <DocRow label="PAN card" hint="Optional" done={!!ob.panImg}
            busy={busy === 'pan'} onPick={() => pickDoc('pan')} />

          <Text style={styles.sec}>4 · Bank account</Text>
          <Text style={styles.hint}>Commission is paid into this account.</Text>
          <Field label="Account holder name" value={bank.holder} onChangeText={(v: string) => setBank((b) => ({ ...b, holder: v }))} placeholder="As printed in your bank records" />
          <Field label="Account number" value={bank.acc} onChangeText={(v: string) => setBank((b) => ({ ...b, acc: v.replace(/\s/g, '') }))} placeholder="Bank account number" keyboardType="number-pad" />
          <Field label="Confirm account number" value={bank.accConfirm} onChangeText={(v: string) => setBank((b) => ({ ...b, accConfirm: v.replace(/\s/g, '') }))} placeholder="Re-enter account number" keyboardType="number-pad" />
          {!!bank.accConfirm && bank.acc !== bank.accConfirm && <Text style={styles.err}>Account numbers don't match.</Text>}
          <Field label="Bank name" value={bank.bankName} onChangeText={(v: string) => setBank((b) => ({ ...b, bankName: v }))} placeholder="e.g. HDFC Bank" />
          <Field label="IFSC code" value={bank.ifsc} onChangeText={(v: string) => setBank((b) => ({ ...b, ifsc: v.toUpperCase() }))} placeholder="e.g. HDFC0001234" autoCapitalize="characters" />
          {ob.bank ? (
            <Text style={styles.ok}>✓ Bank details saved</Text>
          ) : null}
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={saveBank} disabled={busy === 'bank'}>
            <Text style={styles.btnTxt}>{busy === 'bank' ? 'Saving…' : ob.bank ? 'Update bank details' : 'Save bank details'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, ...rest }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.ipt} placeholderTextColor={theme.meta} autoCorrect={false} {...rest} />
    </>
  );
}

function DocRow({ label, hint, done, busy, onPick }: { label: string; hint: string; done: boolean; busy: boolean; onPick: () => void }) {
  return (
    <TouchableOpacity style={[styles.docRow, done && styles.docRowDone]} onPress={onPick} disabled={busy} activeOpacity={0.7}>
      <Feather name={done ? 'check-circle' : 'upload'} size={18} color={done ? theme.green : theme.purple} />
      <View style={{ flex: 1 }}>
        <Text style={styles.docLabel}>{label}</Text>
        <Text style={styles.docHint}>{busy ? 'Uploading…' : done ? 'Submitted' : hint}</Text>
      </View>
      {!done && <Text style={styles.docCta}>Choose</Text>}
    </TouchableOpacity>
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
    width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, flexShrink: 0,
  },
  title: { fontSize: 17, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12, color: theme.purpleInk, fontFamily: 'monospace', fontWeight: '700', marginTop: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  centerTxt: { fontSize: 14, color: theme.meta, textAlign: 'center', lineHeight: 21 },

  pad: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 60,
    width: '100%', maxWidth: 620, alignSelf: 'center',
  },

  card: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardInfo: { backgroundColor: theme.purpleSoft, borderColor: '#DDD0F5' },
  cardDone: { backgroundColor: theme.greenSoft, borderColor: '#C4DFCE' },
  cardTxt: { fontSize: 13, color: theme.purpleInk, lineHeight: 19 },

  creds: {
    marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.lockGold,
    backgroundColor: theme.lockBg, paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  credRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  credLabel: { fontSize: 12.5, color: theme.ink2, flexShrink: 1 },
  credValue: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: theme.ink },
  credNote: { fontSize: 11.5, color: theme.meta, lineHeight: 16 },

  sec: { fontSize: 13, fontWeight: '800', color: theme.ink, marginTop: 22, marginBottom: 8 },
  hint: { fontSize: 12, color: theme.meta, marginBottom: 8 },

  quote: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, backgroundColor: theme.surface },
  quoteTxt: { fontSize: 12.5, color: theme.ink2, lineHeight: 19 },

  ok: { marginTop: 10, color: theme.greenInk, fontWeight: '600', fontSize: 13.5 },
  err: { color: '#9A3B3B', fontSize: 12, marginTop: 4 },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 13, backgroundColor: theme.surface,
  },
  docRowDone: { borderColor: '#C4DFCE', backgroundColor: theme.greenSoft },
  docLabel: { fontSize: 14, fontWeight: '600', color: theme.ink },
  docHint: { fontSize: 12, color: theme.meta, marginTop: 2 },
  docCta: { fontSize: 12.5, fontWeight: '700', color: theme.purple },

  label: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, marginTop: 12, marginBottom: 6 },
  ipt: {
    backgroundColor: theme.inputBg, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 15, paddingVertical: 13, fontSize: 14, color: theme.ink,
  },

  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  btnGreen: { backgroundColor: theme.green },
  btnTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
