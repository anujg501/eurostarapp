import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { api, saveSession } from '../api';
import { theme } from '../theme';

const STAFF_ROLES: { key: string; label: string }[] = [
  { key: 'rep', label: 'Sales Rep' },
  { key: 'office', label: 'Back Office' },
  { key: 'admin', label: 'Admin' },
];

export default function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'customer' | 'staff'>('customer');
  // customer (OTP)
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [needSignup, setNeedSignup] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  // staff (password)
  const [staffRole, setStaffRole] = useState('rep');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    if (phone.replace(/\D/g, '').length < 10) return Alert.alert('Enter a valid mobile number');
    setBusy(true);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devCode ?? null);
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Could not send code', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      const res = await api.verifyOtp(phone, otp, needSignup ? name : undefined, needSignup ? gstin : undefined);
      await saveSession(res);
      onSignedIn();
    } catch (e: any) {
      if (/GSTIN|name/i.test(e.message)) {
        setNeedSignup(true);
        Alert.alert('First time here', 'Please add your name and GSTIN to create your account.');
      } else {
        Alert.alert('Sign in failed', e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function staffSignIn() {
    if (!username.trim() || !password) return Alert.alert('Enter your username and password');
    setBusy(true);
    try {
      const res = await api.staffLogin(staffRole, username.trim(), password);
      await saveSession(res);
      onSignedIn();
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message || 'Wrong username or password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.brand}>eurostar</Text>
        <Text style={styles.tagline}>Wholesale gemstones — order by the lot.</Text>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Customer / Staff switch */}
        <View style={styles.seg}>
          {(['customer', 'staff'] as const).map((m) => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnOn]} onPress={() => setMode(m)}>
              <Text style={[styles.segTxt, mode === m && styles.segTxtOn]}>{m === 'customer' ? 'Customer' : 'Staff'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'customer' ? (
          step === 'phone' ? (
            <>
              <Text style={styles.h1}>Welcome</Text>
              <Text style={styles.sub}>Sign in with your mobile number — we'll text you a code.</Text>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <TextInput style={styles.input} placeholder="9820000000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={13} />
              <TouchableOpacity style={styles.btn} onPress={sendOtp} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.h1}>Enter code</Text>
              <Text style={styles.sub}>Sent to {phone}</Text>
              {devCode ? <Text style={styles.devCode}>Test mode code: {devCode}</Text> : null}
              <Text style={styles.label}>6-DIGIT CODE</Text>
              <TextInput style={styles.input} placeholder="••••••" keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} />
              {needSignup && (
                <>
                  <Text style={styles.label}>YOUR NAME</Text>
                  <TextInput style={styles.input} placeholder="Company / name" value={name} onChangeText={setName} />
                  <Text style={styles.label}>GSTIN</Text>
                  <TextInput style={styles.input} placeholder="27ABCDE1234F1Z5" autoCapitalize="characters" value={gstin} onChangeText={setGstin} />
                </>
              )}
              <TouchableOpacity style={styles.btn} onPress={verify} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify &amp; continue</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('phone')}>
                <Text style={styles.link}>← Change number</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            <Text style={styles.h1}>Staff sign in</Text>
            <Text style={styles.sub}>Reps, back office and admins — sign in with your username.</Text>
            <Text style={styles.label}>ROLE</Text>
            <View style={styles.roleRow}>
              {STAFF_ROLES.map((r) => (
                <TouchableOpacity key={r.key} style={[styles.roleChip, staffRole === r.key && styles.roleChipOn]} onPress={() => setStaffRole(r.key)}>
                  <Text style={[styles.roleTxt, staffRole === r.key && styles.roleTxtOn]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput style={styles.input} placeholder="e.g. REP-204" autoCapitalize="none" value={username} onChangeText={setUsername} />
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} placeholder="Your password" secureTextEntry value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.btn} onPress={staffSignIn} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.emerald },
  hero: { paddingTop: 80, paddingHorizontal: 28, paddingBottom: 26 },
  brand: { color: theme.paper, fontSize: 34, fontWeight: '700', letterSpacing: 1 },
  tagline: { color: theme.emeraldSoft, fontSize: 15, marginTop: 8 },
  card: { flex: 1, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 22 },
  seg: { flexDirection: 'row', backgroundColor: theme.paper2, borderRadius: 99, padding: 4, marginBottom: 22 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center' },
  segBtnOn: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  segTxt: { color: theme.ink3, fontWeight: '700' },
  segTxtOn: { color: theme.ink },
  h1: { fontSize: 26, fontWeight: '700', color: theme.ink },
  sub: { color: theme.ink3, marginTop: 6, marginBottom: 20 },
  label: { color: theme.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: theme.ink },
  btn: { backgroundColor: theme.emerald, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: theme.emerald, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  devCode: { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk, padding: 10, borderRadius: 8, marginTop: 14, textAlign: 'center', fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: theme.border, alignItems: 'center', backgroundColor: theme.surface },
  roleChipOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  roleTxt: { color: theme.ink2, fontWeight: '700', fontSize: 12 },
  roleTxtOn: { color: theme.paper },
});
