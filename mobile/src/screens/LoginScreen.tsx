import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api, setToken } from '../api';
import { theme } from '../theme';

export default function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [needSignup, setNeedSignup] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    if (phone.replace(/\D/g, '').length < 10) return Alert.alert('Enter a valid mobile number');
    setBusy(true);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devCode ?? null); // test mode returns the code
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
      await setToken(res.accessToken);
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

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.brand}>eurostar</Text>
        <Text style={styles.tagline}>Wholesale gemstones — order by the lot.</Text>
      </View>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.h1}>Welcome</Text>
            <Text style={styles.sub}>Sign in with your mobile number — we'll text you a code.</Text>
            <Text style={styles.label}>MOBILE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="9820000000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={13}
            />
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
            <TextInput
              style={styles.input}
              placeholder="••••••"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.emerald },
  hero: { paddingTop: 90, paddingHorizontal: 28, paddingBottom: 30 },
  brand: { color: theme.paper, fontSize: 34, fontWeight: '700', letterSpacing: 1 },
  tagline: { color: theme.emeraldSoft, fontSize: 15, marginTop: 8 },
  card: { flex: 1, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  h1: { fontSize: 26, fontWeight: '700', color: theme.ink },
  sub: { color: theme.ink3, marginTop: 6, marginBottom: 22 },
  label: { color: theme.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: theme.ink,
  },
  btn: { backgroundColor: theme.emerald, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: theme.emerald, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  devCode: { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk, padding: 10, borderRadius: 8, marginTop: 14, textAlign: 'center', fontWeight: '700' },
});
