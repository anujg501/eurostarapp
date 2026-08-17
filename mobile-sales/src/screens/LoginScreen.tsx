import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { api, setToken } from '../api';
import { theme } from '../theme';

const LOGO = require('../../assets/eurostar-logo.png');
const OTP_LEN = 6;

type Who = 'customer' | 'rep' | 'office';

// Drawn icons, not emoji. The emoji ones came out of the system font as small
// multicolour glyphs that ignored the tab's own colour and sat oddly against
// the label; these are the same thin line icons the website's tabs use, and
// they take the text colour with them.
const TABS: { id: Who; label: string; icon: 'user' | 'users' | 'office' }[] = [
  { id: 'customer', label: 'Customer', icon: 'user' },
  { id: 'rep', label: 'Sales Rep', icon: 'users' },
  { id: 'office', label: 'Back Office', icon: 'office' },
];

/** Feather has no building, so the back-office tab borrows one from Material. */
const TabIcon = ({ icon, color }: { icon: 'user' | 'users' | 'office'; color: string }) =>
  icon === 'office'
    ? <MaterialIcons name="apartment" size={19} color={color} />
    : <Feather name={icon} size={18} color={color} />;

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

  // Two customer modes, as the website has: 'signin' is a returning number and
  // the code alone; 'signup' is a first-time one and asks for the business name
  // and GSTIN once, before the code.
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const signup = mode === 'signup';
  const [bizName, setBizName] = useState('');
  const [gstin, setGstin] = useState('');

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  // 2 digits + 10-char PAN + entity + Z + checksum. A format check, same as the
  // web's validGST — the real verification is the office's.
  const validGst = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase());
  const validName = bizName.trim().length > 1;

  /** Move between sign-in and create-account, clearing anything half-typed. */
  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setSent(false);
    setOtp('');
    setDevCode(null);
  };

  async function sendOtp() {
    if (!validPhone) { Alert.alert('Enter a 10-digit mobile number'); return; }
    if (signup && !validName) { Alert.alert('Enter your firm or business name'); return; }
    if (signup && !validGst) { Alert.alert('Enter a valid 15-character GSTIN'); return; }
    setBusy(true);
    try {
      const r = await api.requestOtp(phone, signup ? 'signup' : 'login');
      setSent(true);
      // Development servers hand the code back instead of texting it.
      setDevCode(r.devCode || null);
    } catch (e: any) {
      // The server gates the two flows — sign-in refuses an unknown number and
      // create-account refuses a registered one. Move to the mode the person
      // can actually continue in rather than leaving them on a dead end.
      const d = e?.data?.details;
      if (d?.signupRequired) {
        switchMode('signup');
        Alert.alert('New number', 'This mobile is not registered yet. Add your business name and GSTIN to create the account.');
        return;
      }
      if (d?.alreadyRegistered) {
        switchMode('signin');
        Alert.alert('Already registered', 'This mobile already has an account — sign in with the code instead.');
        return;
      }
      Alert.alert('Could not send the code', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  async function verify() {
    if (otp.length < OTP_LEN) { Alert.alert(`Enter the ${OTP_LEN}-digit code`); return; }
    setBusy(true);
    try {
      // The name and GSTIN ride along with the code on a first-time account;
      // the server ignores them for a number it already knows.
      const r = await api.verifyOtp(
        phone, otp, remember,
        signup ? bizName.trim() : undefined,
        signup ? gstin.trim().toUpperCase() : undefined
      );
      await setToken(r.accessToken);
      onSignedIn();
    } catch (e: any) {
      // 422 means the number is new and the server wants a name + GSTIN. Open
      // the create-account fields here rather than sending anyone to a browser;
      // the code they were sent is still good.
      if (e?.status === 422) {
        setMode('signup');
        Alert.alert(
          'A few details first',
          'This number is new. Add your business name and GSTIN, then enter the code again to finish creating the account.'
        );
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
                    <TabIcon icon={t.icon} color={on ? theme.ink : theme.meta} />
                    <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.h1}>
              {who === 'customer' && signup ? 'Create your account' : 'Welcome back'}
            </Text>

            {who === 'customer' ? (
              <>
                <Text style={styles.sub}>
                  {signup
                    ? "First-time setup — add your GSTIN once, then verify your mobile. Next time you'll go straight in."
                    : "Sign in with your registered mobile number — we'll text you a code."}
                </Text>

                {signup && (
                  <>
                    <Text style={styles.label}>FIRM / BUSINESS NAME</Text>
                    <TextInput
                      style={styles.ipt}
                      value={bizName}
                      onChangeText={setBizName}
                      placeholder="As it appears on your GST certificate"
                      placeholderTextColor={theme.meta}
                      autoCapitalize="words"
                    />

                    <Text style={styles.label}>GSTIN</Text>
                    <TextInput
                      style={styles.ipt}
                      value={gstin}
                      // Stored and sent uppercase, which is the only form a
                      // GSTIN takes.
                      onChangeText={(v) => setGstin(v.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
                      placeholder="27ABCDE1234F1Z5"
                      placeholderTextColor={theme.meta}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={15}
                    />
                    {!!gstin && !validGst && (
                      <Text style={styles.bad}>That does not look like a 15-character GSTIN.</Text>
                    )}
                  </>
                )}

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
                  {busy ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.btnTxt}>
                      {sent ? (signup ? 'Verify & create account' : 'Sign in')
                            : (signup ? 'Create account & send OTP' : 'Send OTP')}
                    </Text>
                  )}
                </TouchableOpacity>
                {sent && (
                  <TouchableOpacity onPress={sendOtp} disabled={busy}>
                    <Text style={styles.link}>Send the code again</Text>
                  </TouchableOpacity>
                )}

                {/* The way between the two, as the website words it. */}
                <TouchableOpacity
                  style={styles.switchRow}
                  onPress={() => switchMode(signup ? 'signin' : 'signup')}
                  disabled={busy}
                >
                  <Text style={styles.switchTxt}>
                    {signup ? 'Already registered? ' : 'First time here? '}
                    <Text style={styles.switchLink}>{signup ? 'Sign in' : 'Create your account'}</Text>
                  </Text>
                </TouchableOpacity>
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11, gap: 5 },
  tabOn: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
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
  bad: { fontSize: 12, color: theme.ruby, marginTop: -4, marginBottom: 4 },
  switchRow: { marginTop: 16, alignItems: 'center' },
  switchTxt: { fontSize: 13.5, color: theme.meta },
  switchLink: { color: theme.emeraldInk, fontWeight: '700' },

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
