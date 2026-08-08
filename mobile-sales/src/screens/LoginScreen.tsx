import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, setToken } from '../api';
import { theme } from '../theme';

const LOGO = require('../../assets/eurostar-logo.png');
const OTP_LEN = 6;

type Who = 'customer' | 'rep' | 'office';
const TABS: { id: Who; label: string; icon: string }[] = [
  { id: 'customer', label: 'Customer', icon: '👤' },
  { id: 'rep', label: 'Sales Rep', icon: '👥' },
  { id: 'office', label: 'Back Office', icon: '🏢' },
];

// A customer signs in with the mobile number the office already holds — one
// code by SMS, no password to forget on a shop floor. Staff use their own
// username, the same credentials as the CRM.
export default function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [who, setWho] = useState<Who>('customer');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  async function sendOtp() {
    if (!validPhone) { Alert.alert('Enter a 10-digit mobile number'); return; }
    setBusy(true);
    try {
      const r = await api.requestOtp(phone, 'login');
      setSent(true);
      // Development servers hand the code back instead of texting it.
      setDevCode(r.devCode || null);
    } catch (e: any) {
      Alert.alert('Could not send the code', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  async function verify() {
    if (otp.length < OTP_LEN) { Alert.alert(`Enter the ${OTP_LEN}-digit code`); return; }
    setBusy(true);
    try {
      const r = await api.verifyOtp(phone, otp, remember);
      await setToken(r.accessToken);
      onSignedIn();
    } catch (e: any) {
      // 422 means the number is new and the server wants a name + GSTIN. That
      // is account creation, which belongs on the website's own sign-up flow —
      // say so rather than half-doing it here.
      if (e?.status === 422) {
        Alert.alert('New number', 'This number is not registered yet. Create the account on the Eurostar website, then sign in here.');
      } else {
        Alert.alert('Sign in failed', e?.message || 'Please try again.');
      }
    } finally { setBusy(false); }
  }

  async function staffLogin() {
    if (!username.trim() || !password) { Alert.alert('Enter your username and password'); return; }
    setBusy(true);
    try {
      const r = await api.login(who as 'rep' | 'office', username.trim(), password);
      await setToken(r.accessToken);
      onSignedIn();
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.status === 401 ? 'That username or password was not accepted.' : e?.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* The hero from the website, so the app feels like the same shop. */}
          <View style={styles.hero}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.eyebrow}>WHOLESALE PORTAL · MUMBAI &amp; JAIPUR</Text>
            <Text style={styles.heroTitle}>Makes <Text style={styles.heroEm}>true</Text> beauty,{'\n'}by the lot.</Text>
            <Text style={styles.heroSub}>
              40 years sourcing moissanite, lab-grown gems, Color Cubic Zirconia, mother of pearl and pearls —
              calibrated, certified, delivered.
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.tabs}>
              {TABS.map((t) => {
                const on = t.id === who;
                return (
                  <TouchableOpacity key={t.id} style={[styles.tab, on && styles.tabOn]} onPress={() => setWho(t.id)} activeOpacity={0.8}>
                    <Text style={styles.tabIcon}>{t.icon}</Text>
                    <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.h1}>Welcome back</Text>

            {who === 'customer' ? (
              <>
                <Text style={styles.sub}>Sign in with your registered mobile number — we'll text you a code.</Text>

                <Text style={styles.label}>MOBILE NUMBER</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.cc}><Text style={styles.ccTxt}>+91</Text></View>
                  <TextInput
                    style={[styles.ipt, { flex: 1 }]}
                    value={phone}
                    onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setSent(false); }}
                    placeholder="9820000000"
                    placeholderTextColor={theme.meta}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>

                {sent && (
                  <>
                    <Text style={styles.label}>CODE</Text>
                    <TextInput
                      style={styles.ipt}
                      value={otp}
                      onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, OTP_LEN))}
                      placeholder={`${OTP_LEN}-digit code`}
                      placeholderTextColor={theme.meta}
                      keyboardType="number-pad"
                      maxLength={OTP_LEN}
                    />
                    {!!devCode && <Text style={styles.hint}>Test code on this server: {devCode}</Text>}
                  </>
                )}

                <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={sent ? verify : sendOtp} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{sent ? 'Sign in' : 'Send OTP'}</Text>}
                </TouchableOpacity>
                {sent && (
                  <TouchableOpacity onPress={sendOtp} disabled={busy}>
                    <Text style={styles.link}>Send the code again</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.sub}>Sign in with your {who === 'rep' ? 'Sales Rep' : 'Back Office'} credentials.</Text>

                <Text style={styles.label}>USERNAME</Text>
                <TextInput
                  style={styles.ipt}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={who === 'rep' ? 'REP-204' : 'office'}
                  placeholderTextColor={theme.meta}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.ipt}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.meta}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={staffLogin}
                />

                <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={staffLogin} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign in</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.rememberRow} activeOpacity={0.7} onPress={() => setRemember((v) => !v)}>
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Text style={styles.tick}>✓</Text>}
              </View>
              <Text style={styles.rememberTxt}>Keep me signed in on this device</Text>
            </TouchableOpacity>

            <Text style={styles.foot}>Eurostar Technologies · Estd 1980</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.paper },
  scroll: { paddingBottom: 40 },

  hero: { backgroundColor: theme.emerald, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 30 },
  logo: { height: 26, width: 108, tintColor: '#fff' },
  eyebrow: { color: theme.gold, fontSize: 11.5, fontWeight: '700', letterSpacing: 1, marginTop: 18 },
  heroTitle: { color: '#fff', fontSize: 27, fontWeight: '700', lineHeight: 34, marginTop: 10 },
  heroEm: { fontStyle: 'italic' },
  heroSub: { color: theme.onDarkMeta, fontSize: 13.5, lineHeight: 20, marginTop: 12 },

  body: { paddingHorizontal: 22, paddingTop: 20, width: '100%', maxWidth: 520, alignSelf: 'center' },

  tabs: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  tabOn: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  tabIcon: { fontSize: 15, marginBottom: 3 },
  tabTxt: { fontSize: 12, fontWeight: '600', color: theme.meta },
  tabTxtOn: { color: theme.ink },

  h1: { fontSize: 28, fontWeight: '700', color: theme.ink, marginTop: 22 },
  sub: { fontSize: 13.5, color: theme.meta, marginTop: 6, lineHeight: 20 },

  label: { fontSize: 11.5, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 20, marginBottom: 7 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  cc: { justifyContent: 'center', paddingHorizontal: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10 },
  ccTxt: { fontSize: 15, fontWeight: '600', color: theme.ink2 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.ink,
  },
  hint: { fontSize: 12, color: theme.meta, marginTop: 8 },

  btn: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: theme.emeraldInk, fontSize: 13.5, fontWeight: '600', marginTop: 14 },

  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  checkbox: {
    width: 19, height: 19, borderRadius: 4, borderWidth: 1.5, borderColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  checkboxOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  tick: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rememberTxt: { fontSize: 13.5, color: theme.ink2 },

  foot: { textAlign: 'center', fontSize: 11.5, color: theme.meta, marginTop: 26 },
});
