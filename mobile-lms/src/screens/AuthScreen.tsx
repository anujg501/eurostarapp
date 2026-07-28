import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api, setToken } from '../api';
import { theme } from '../theme';

// A labelled input with a leading icon (matches the web candidate card).
function Field({
  label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry,
  autoCapitalize, editable = true, right,
}: any) {
  return (
    <View style={{ marginBottom: 11 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, editable === false && styles.inputRowLocked]}>
        <Feather name={icon} size={15} color={theme.purple} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.meta}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
        {right}
      </View>
    </View>
  );
}

export default function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reg = mode === 'register';
  const cleanPhone = phone.replace(/\D/g, '');

  function resetPhone(t: string) {
    setPhone(t); setOtpSent(false); setVerified(false); setOtp('');
  }

  async function sendOtp() {
    if (cleanPhone.length < 10) { Alert.alert('Enter a valid 10-digit mobile number'); return; }
    setBusy(true);
    try {
      const r = await api.requestOtp(cleanPhone, reg ? 'signup' : 'login');
      setOtpSent(true);
      setDevCode(r.devCode || null);
    } catch (e: any) {
      Alert.alert('Could not send code', e.message || 'Try again.');
    } finally { setBusy(false); }
  }

  function verifyCode() {
    if (otp.trim().length < 4) { Alert.alert('Enter the code sent to your phone'); return; }
    setVerified(true);
  }

  async function submit() {
    if (reg && (!first.trim() || !last.trim())) { Alert.alert('Enter your first and last name'); return; }
    if (!verified) { Alert.alert('Please verify your mobile number first'); return; }
    if (reg && !password) { Alert.alert('Set a password'); return; }
    setBusy(true);
    try {
      const name = reg ? `${first.trim()} ${last.trim()}` : undefined;
      const r = await api.verifyOtp(cleanPhone, otp.trim(), name, reg ? email.trim() : undefined);
      await setToken(r.accessToken);
      onSignedIn();
    } catch (e: any) {
      Alert.alert('Registration failed', e.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.capBar} />
            <Text style={styles.brand}>eurostar<Text style={styles.reg}> ®</Text></Text>

            <Text style={styles.h1}>{reg ? 'Create Account' : 'Welcome back'}</Text>
            <Text style={styles.h1sub}>{reg ? 'Register to continue' : 'Please login to your account'}</Text>

            {reg && (
              <>
                <Field label="First Name" icon="user" value={first} onChangeText={setFirst} placeholder="First name" />
                <Field label="Last Name" icon="user" value={last} onChangeText={setLast} placeholder="Last name" />
              </>
            )}

            <Field
              label="Mobile Number"
              icon="phone"
              value={phone}
              onChangeText={resetPhone}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
              editable={!verified}
              right={
                verified ? (
                  <Text style={styles.tick}>✓</Text>
                ) : (
                  <TouchableOpacity onPress={sendOtp} disabled={busy}>
                    <Text style={styles.sendOtp}>{otpSent ? 'Resend' : 'Send OTP'}</Text>
                  </TouchableOpacity>
                )
              }
            />

            {otpSent && !verified && (
              <View style={{ marginTop: -4, marginBottom: 14 }}>
                <View style={styles.inputRow}>
                  <Feather name="key" size={16} color={theme.purple} style={{ marginRight: 9 }} />
                  <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="Enter OTP" placeholderTextColor={theme.meta} keyboardType="number-pad" maxLength={6} />
                  <TouchableOpacity onPress={verifyCode}><Text style={styles.sendOtp}>Verify</Text></TouchableOpacity>
                </View>
                {devCode ? <Text style={styles.devHint}>Test code: {devCode}</Text> : null}
              </View>
            )}

            {verified && (
              <View style={styles.verifiedRow}>
                <View style={styles.verifiedDot}><Text style={styles.verifiedDotTxt}>✓</Text></View>
                <Text style={styles.verifiedTxt}>Mobile number verified</Text>
              </View>
            )}

            {reg && (
              <>
                <Field label="Email Address" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
                <Field label="Password" icon="lock" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry autoCapitalize="none" />
              </>
            )}

            <TouchableOpacity style={[styles.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaTxt}>{reg ? 'Register' : 'Login'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(reg ? 'login' : 'register'); }}>
              <Text style={styles.switch}>
                {reg ? 'Already have an account? ' : 'New here? '}
                <Text style={styles.switchLink}>{reg ? 'Login' : 'Create account'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.foot}>Eurostar Technologies · Recruitment portal</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bgMid },
  scroll: { padding: 18, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius.xl, paddingHorizontal: 22, paddingBottom: 24, overflow: 'hidden' },
  capBar: { height: 10, backgroundColor: theme.purple, marginHorizontal: -22, marginBottom: 16, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl },
  brand: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: theme.ink, letterSpacing: -0.5 },
  reg: { fontSize: 11, color: theme.meta },
  tabs: { flexDirection: 'row', backgroundColor: theme.paper, borderRadius: theme.radius.md, padding: 4, marginTop: 16, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: theme.radius.sm, alignItems: 'center' },
  tabOn: { backgroundColor: theme.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabTxt: { color: theme.meta, fontWeight: '700', fontSize: 13.5 },
  tabTxtOn: { color: theme.purpleInk },
  h1: { textAlign: 'center', fontSize: 23, fontWeight: '700', color: theme.ink, marginTop: 8, marginBottom: 3 },
  h1sub: { textAlign: 'center', fontSize: 13.5, color: theme.meta, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, marginBottom: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F2F8', borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 13, minHeight: 46 },
  inputRowLocked: { borderColor: '#E0A93C', backgroundColor: '#FFF8EC' },
  icon: { fontSize: 15, marginRight: 8, color: theme.purple },
  input: { flex: 1, fontSize: 14, color: theme.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  sendOtp: { color: theme.purpleInk, fontWeight: '700', fontSize: 13 },
  tick: { color: '#E0A93C', fontWeight: '800', fontSize: 16 },
  devHint: { color: theme.green, fontSize: 12, marginTop: 6, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 6 },
  verifiedDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.green, alignItems: 'center', justifyContent: 'center' },
  verifiedDotTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
  verifiedTxt: { color: theme.green, fontWeight: '700', fontSize: 13.5 },
  cta: { backgroundColor: theme.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  ctaTxt: { color: '#fff', fontWeight: '700', fontSize: 15.5 },
  switch: { textAlign: 'center', color: theme.meta, marginTop: 16, fontSize: 13.5 },
  switchLink: { color: theme.purpleInk, fontWeight: '700' },
  foot: { color: theme.onDarkMeta, fontSize: 11, textAlign: 'center', marginTop: 18 },
});
