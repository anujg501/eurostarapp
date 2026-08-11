import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, setRole, setToken, type StaffRole } from '../api';
import { theme } from '../theme';

const LOGO = require('../../assets/eurostar-logo.png');

// Three ways in, as on the web CRM: a rep signs in with the Rep ID issued on
// hire, office and admin with their own usernames. The role is part of the
// sign-in, not a preference — the server issues a token for that role or
// refuses, and everything the app shows follows from it.
const ROLES: { id: StaffRole; label: string; icon: string; hint: string }[] = [
  { id: 'rep', label: 'Sales Rep', icon: '👤', hint: 'Sign in with your Sales Rep credentials.' },
  { id: 'admin', label: 'Admin', icon: '✦', hint: 'Administration console sign-in.' },
  { id: 'office', label: 'Back Office', icon: '🏢', hint: 'Back office desk sign-in.' },
];

export default function LoginScreen({ onSignedIn }: { onSignedIn: (role: StaffRole) => void }) {
  const [role, setRoleState] = useState<StaffRole>('rep');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const current = ROLES.find((r) => r.id === role)!;

  /**
   * The server matches the username exactly (findFirst on userId), so case
   * decides whether sign-in works at all: rep ids are issued uppercase
   * (REP-204) while office and admin are lowercase.
   *
   * So the field follows the role rather than one rule for everybody — CAPS for
   * a rep, lowercase for office and admin. It is applied as you type, so what
   * is on screen is exactly what gets sent; the field used to force CAPS for
   * all three, which made "office" and "admin" impossible to type.
   */
  const forCase = (v: string, r: StaffRole = role) =>
    r === 'rep' ? v.toUpperCase() : v.toLowerCase();

  // Switching tab re-cases whatever is already typed, so the field can never
  // sit in a case the newly chosen role would reject.
  const pickRole = (r: StaffRole) => {
    setRoleState(r);
    setUsername((u) => forCase(u, r));
  };

  async function submit() {
    if (!username.trim() || !password) {
      Alert.alert('Enter your username and password');
      return;
    }
    setBusy(true);
    try {
      const r = await api.login(role, forCase(username.trim()), password, remember);
      await setToken(r.accessToken);
      await setRole(role);
      onSignedIn(role);
    } catch (e: any) {
      // 401 is a wrong password; anything else is worth showing as it came.
      Alert.alert('Sign in failed', e?.status === 401 ? 'That username or password was not accepted.' : e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.tabs}>
            {ROLES.map((r) => {
              const on = r.id === role;
              return (
                <TouchableOpacity key={r.id} style={[styles.tab, on && styles.tabOn]} onPress={() => pickRole(r.id)} activeOpacity={0.8}>
                  <Text style={styles.tabIcon}>{r.icon}</Text>
                  <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>{current.hint}</Text>

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            // Android reads autoCapitalize when the input is created and does
            // not re-read it on a prop change — the screen mounts as Sales Rep,
            // so the keyboard stayed on CAPS after switching to office/admin
            // even though the value underneath was lowercased. Keying on the
            // role remounts the field, which is the only thing that makes the
            // keyboard follow.
            key={role}
            style={styles.ipt}
            value={username}
            onChangeText={(v) => setUsername(forCase(v))}
            placeholder={role === 'rep' ? 'REP-204' : role === 'office' ? 'office' : 'admin'}
            placeholderTextColor={theme.meta}
            // CAPS for a rep, lowercase for office and admin. The keyboard hint
            // and the text itself agree, so nothing is silently changed between
            // what is typed and what is sent.
            autoCapitalize={role === 'rep' ? 'characters' : 'none'}
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            spellCheck={false}
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
            onSubmitEditing={submit}
          />

          <TouchableOpacity style={styles.rememberRow} activeOpacity={0.7} onPress={() => setRemember((v) => !v)}>
            <View style={[styles.checkbox, remember && styles.checkboxOn]}>
              {remember && <Text style={styles.tick}>✓</Text>}
            </View>
            <Text style={styles.rememberTxt}>Keep me signed in on this device</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign in</Text>}
          </TouchableOpacity>

          <Text style={styles.foot}>Eurostar Technologies · Internal use only</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.paper },
  pad: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40, width: '100%', maxWidth: 520, alignSelf: 'center' },

  tabs: {
    flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, padding: 4, gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  tabOn: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  tabIcon: { fontSize: 15, marginBottom: 3 },
  tabTxt: { fontSize: 12.5, fontWeight: '600', color: theme.meta },
  tabTxtOn: { color: theme.ink },

  logoWrap: { alignItems: 'flex-start', marginTop: 34 },
  logo: { height: 30, width: 118 },

  h1: { fontSize: 30, fontWeight: '700', color: theme.ink, marginTop: 22 },
  sub: { fontSize: 14, color: theme.meta, marginTop: 6 },

  label: { fontSize: 11.5, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 22, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.inputBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.ink,
  },

  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  checkbox: {
    width: 19, height: 19, borderRadius: 4, borderWidth: 1.5, borderColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  checkboxOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  tick: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rememberTxt: { fontSize: 13.5, color: theme.ink2 },

  btn: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  foot: { textAlign: 'center', fontSize: 11.5, color: theme.meta, marginTop: 24 },
});
