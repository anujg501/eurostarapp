import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api, setToken } from '../api';
import { theme } from '../theme';
import MiraFab from '../components/MiraFab';

const LOGO = require('../../assets/eurostar-logo.png');

// The back room issues codes of config.otp.length, which defaults to 6
// (src/services/otp.ts). The web candidate demo used 4 boxes — with the real
// API that made the code impossible to type in.
const OTP_LEN = 6;

// A labelled input with a leading icon — mirrors .cand-label + .cand-ipt-wrap
// in the web candidate UI (docs/lms/lms/lms.css).
function Field({
  label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry,
  autoCapitalize, maxLength, locked = false, right, first = false,
}: any) {
  return (
    <>
      {/* `first` mimics CSS margin-collapsing: the web label's 14px top margin
          collapses into the 22px bottom margin of the element above it. */}
      <Text style={[styles.label, first && { marginTop: 0 }]}>{label}</Text>
      <View style={[styles.iptWrap, locked && styles.iptLocked]}>
        <Feather name={icon} size={18} color={theme.purple} style={styles.ic} />
        <TextInput
          style={styles.ipt}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.meta}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={!locked}
        />
        {right}
      </View>
    </>
  );
}

export default function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [otpStage, setOtpStage] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const [remember, setRemember] = useState(true);

  const reg = mode === 'register';
  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const otpFull = otp.join('').length === OTP_LEN;
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  // Sign-up proves the number by OTP; coming back is email + password, which is
  // what the web login pane does and why registration stores both.
  const canSubmit = reg ? validPhone && otpStage === 'verified' : validEmail && password.length > 0;

  function setDigit(i: number, v: string) {
    // Autofill/paste can drop the whole code into one box — spread it instead.
    if (v.length > 1) {
      const digits = v.replace(/\D/g, '').slice(0, OTP_LEN - i).split('');
      if (!digits.length) return;
      const next = otp.slice();
      digits.forEach((d, k) => { next[i + k] = d; });
      setOtp(next);
      otpRefs.current[Math.min(i + digits.length, OTP_LEN - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(v)) return;
    const next = otp.slice();
    next[i] = v;
    setOtp(next);
    if (v && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  }

  function onPhone(t: string) {
    setPhone(t.replace(/\D/g, ''));
    setOtpStage('idle');
    setOtp(Array(OTP_LEN).fill(''));
    setDevCode(null);
  }

  async function sendOtp() {
    if (!validPhone) return;
    setBusy(true);
    try {
      const r = await api.requestOtp(phone, reg ? 'signup' : 'login');
      setOtpStage('sent');
      setDevCode(r.devCode || null);
    } catch (e: any) {
      Alert.alert('Could not send code', e.message || 'Try again.');
    } finally { setBusy(false); }
  }

  function verifyOtp() {
    if (!otpFull) return;
    setOtpStage('verified');
  }

  async function submit() {
    if (!canSubmit) return;
    if (reg && (!first.trim() || !last.trim())) { Alert.alert('Enter your first and last name'); return; }
    if (reg && !password) { Alert.alert('Set a password'); return; }
    setBusy(true);
    try {
      let accessToken: string;
      if (reg) {
        const name = `${first.trim()} ${last.trim()}`;
        // Email is optional, but the server validates it as an email when present
        // — sending "" for a blank field failed the whole registration with a
        // validation error rather than being treated as "not given".
        const mail = email.trim() ? email.trim() : undefined;
        ({ accessToken } = await api.verifyOtp(phone, otp.join(''), name, mail, password));
      } else {
        ({ accessToken } = await api.login(email.trim(), password, remember));
      }
      await setToken(accessToken);
      onSignedIn();
    } catch (e: any) {
      Alert.alert(reg ? 'Registration failed' : 'Login failed', e.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.pad}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.h1}>{reg ? 'Create Account' : 'Welcome Back!'}</Text>
          <Text style={styles.sub}>{reg ? 'Register to continue' : 'Please login to your account'}</Text>

          {reg && (
            <>
              <Field first label="First Name" icon="user" value={first} onChangeText={setFirst} placeholder="First name" />
              <Field label="Last Name" icon="user" value={last} onChangeText={setLast} placeholder="Last name" />
            </>
          )}

          {/* The number is only proved at sign-up. Logging back in is email +
              password, exactly as the web login pane does it. */}
          {reg && (
          <>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <View style={[styles.iptWrap, { flex: 1 }, otpStage === 'verified' && styles.iptLocked]}>
              <Feather name="phone" size={18} color={theme.purple} style={styles.ic} />
              <TextInput
                style={styles.ipt}
                value={phone}
                onChangeText={onPhone}
                placeholder="10-digit mobile"
                placeholderTextColor={theme.meta}
                keyboardType="number-pad"
                maxLength={10}
                editable={otpStage !== 'verified'}
              />
              {otpStage === 'verified' && <Text style={styles.lockTick}>✓</Text>}
            </View>
            {otpStage !== 'verified' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnInline, !validPhone && styles.btnOff]}
                onPress={sendOtp}
                disabled={!validPhone || busy}
              >
                <Text style={styles.btnInlineTxt}>{otpStage === 'sent' ? 'Resend' : 'Send OTP'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {otpStage === 'sent' && (
            <>
              <View style={styles.otpNote}>
                <Text style={styles.otpNoteTxt}>
                  OTP sent to <Text style={{ fontWeight: '700' }}>+91 {phone}</Text>.
                  {devCode ? ` Test code: ${devCode}.` : ` Enter the ${OTP_LEN}-digit code.`}
                </Text>
              </View>
              <View style={styles.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    style={styles.otpBox}
                    value={d}
                    onChangeText={(v) => setDigit(i, v)}
                    keyboardType="number-pad"
                    maxLength={OTP_LEN}
                    textAlign="center"
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btn, styles.btnGreen, { marginTop: 14 }, !otpFull && styles.btnOff]}
                onPress={verifyOtp}
                disabled={!otpFull}
              >
                <Text style={styles.btnTxt}>Verify OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {otpStage === 'verified' && (
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedDot}><Text style={styles.verifiedDotTxt}>✓</Text></View>
              <Text style={styles.verifiedTxt}>Mobile number verified</Text>
            </View>
          )}
          </>
          )}

          <Field first={!reg} label="Email Address" icon="mail" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" icon="lock" value={password} onChangeText={setPassword} placeholder={reg ? 'Create a password' : 'Your password'} secureTextEntry autoCapitalize="none" />

          {!reg && (
            <TouchableOpacity style={styles.rememberRow} activeOpacity={0.7} onPress={() => setRemember((r) => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Text style={styles.rememberTxt}>Remember me</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, { marginTop: 20 }, (!canSubmit || busy) && styles.btnOff]}
            onPress={submit}
            disabled={!canSubmit || busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{reg ? 'Register' : 'Sign In'}</Text>}
          </TouchableOpacity>

          {reg && !canSubmit && <Text style={styles.hint}>Verify your mobile number to register.</Text>}

          <TouchableOpacity onPress={() => setMode(reg ? 'login' : 'register')}>
            <Text style={styles.link}>
              {reg ? 'Already have an account? ' : 'New here? '}
              <Text style={styles.linkB}>{reg ? 'Login' : 'Create account'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <MiraFab />
    </SafeAreaView>
  );
}

// Values mirror .cand-* in docs/lms/lms/lms.css so the app and the web
// candidate flow render the same screen.
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.surface },
  // .cand-pad { padding: 22px 20px 30px } + the mobile rule's 96px Mira clearance.
  // Top-aligned like the web card — centering would push the footer link off-screen.
  pad: {
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 96,
    width: '100%', maxWidth: 520, alignSelf: 'center',
  },

  logoWrap: { alignItems: 'center', marginBottom: 6 },
  logo: { height: 34, width: 132 },

  h1: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: theme.ink, marginTop: 12, marginBottom: 4 },
  sub: { fontSize: 14, textAlign: 'center', color: theme.meta, marginBottom: 22 },

  label: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, marginTop: 14, marginBottom: 6 },
  iptWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15,
  },
  iptLocked: { borderColor: theme.lockGold, backgroundColor: theme.lockBg },
  ic: { marginRight: 11 },
  ipt: { flex: 1, fontSize: 14, color: theme.ink, paddingVertical: 14 },
  lockTick: { color: theme.green, fontSize: 15, fontWeight: '700' },

  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },

  otpNote: { backgroundColor: theme.purpleSoft, borderWidth: 1, borderColor: '#DDD0F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 12 },
  otpNoteTxt: { fontSize: 13, color: theme.purpleInk, lineHeight: 19 },
  // Six boxes have to fit 320dp of usable width, so they are narrower than the
  // web demo's 54px four-box row.
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' },
  otpBox: {
    flex: 1, maxWidth: 54, paddingVertical: 12, fontSize: 19, fontWeight: '700', color: theme.ink,
    backgroundColor: theme.inputBg, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
  },

  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  verifiedDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.green, alignItems: 'center', justifyContent: 'center' },
  verifiedDotTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  verifiedTxt: { color: theme.greenInk, fontSize: 13.5, fontWeight: '600' },

  // .cand-btn
  btn: { backgroundColor: theme.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  btnGreen: { backgroundColor: theme.green },
  btnInline: { paddingVertical: 0, paddingHorizontal: 16 },
  btnInlineTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  btnOff: { opacity: 0.5 },

  // Login's "Remember me" — the web pane's checkbox row.
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, marginLeft: 2 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  checkboxOn: { backgroundColor: theme.purple, borderColor: theme.purple },
  rememberTxt: { fontSize: 13.5, color: theme.ink2 },

  hint: { textAlign: 'center', fontSize: 12, color: theme.meta, marginTop: 10 },
  link: { textAlign: 'center', fontSize: 13.5, color: theme.meta, marginTop: 16 },
  linkB: { color: theme.purple, fontWeight: '700' },
});
