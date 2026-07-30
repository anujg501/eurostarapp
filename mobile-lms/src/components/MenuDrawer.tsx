import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';

type Me = { name: string; candId?: string; email?: string; phone?: string; hasPassword?: boolean };

/**
 * The ☰ drawer: who you are, the account actions a candidate actually needs
 * (change password, sign out), and nothing that belongs on the dashboard tiles.
 */
export default function MenuDrawer({
  visible,
  onClose,
  onSignOut,
}: {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    api
      .me()
      .then((r) => alive && setMe(r as Me))
      .catch(() => {/* the drawer still works without it */});
    return () => { alive = false; };
  }, [visible]);

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'You will need your email and password to get back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); onSignOut(); } },
    ]);
  };

  const initials = (me?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area closes, as a drawer should */}
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />

        <SafeAreaView edges={['top', 'bottom']} style={styles.panel}>
          <View style={styles.head}>
            <View style={styles.avatar}><Text style={styles.avatarTxt}>{initials}</Text></View>
            <Text style={styles.name} numberOfLines={1}>{me?.name || 'Candidate'}</Text>
            {me?.candId ? <Text style={styles.candId}>{me.candId}</Text> : null}
            {me?.email ? <Text style={styles.meta} numberOfLines={1}>{me.email}</Text> : null}
            {me?.phone ? <Text style={styles.meta}>+91 {me.phone}</Text> : null}
          </View>

          <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
            <Row icon="lock" label="Change password" onPress={() => setPwOpen(true)} />
            <Row icon="log-out" label="Sign out" onPress={confirmSignOut} danger />
          </ScrollView>

          <Text style={styles.foot}>Eurostar Academy · Recruitment</Text>
        </SafeAreaView>
      </View>

      <ChangePassword
        visible={pwOpen}
        onClose={() => setPwOpen(false)}
        hasPassword={me?.hasPassword !== false}
      />
    </Modal>
  );
}

function Row({ icon, label, onPress, danger }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Feather name={icon} size={18} color={danger ? theme.danger : theme.purple} />
      <Text style={[styles.rowTxt, danger && { color: theme.danger }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={theme.meta} />
    </TouchableOpacity>
  );
}

function ChangePassword({
  visible,
  onClose,
  hasPassword,
}: {
  visible: boolean;
  onClose: () => void;
  hasPassword: boolean;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) { setCurrent(''); setNext(''); setConfirm(''); }
  }, [visible]);

  async function save() {
    if (next.length < 6) { Alert.alert('Use at least 6 characters'); return; }
    if (next !== confirm) { Alert.alert('The two new passwords do not match'); return; }
    setBusy(true);
    try {
      await api.changePassword(next, current || undefined);
      Alert.alert('Password changed', 'Use your new password next time you log in.');
      onClose();
    } catch (e: any) {
      Alert.alert('Could not change password', e.message || 'Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Change password</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Only asked for when there is one to prove — a candidate who has
              never set a password should not see a field they must leave blank. */}
          {hasPassword && (
            <>
              <Text style={styles.label}>Current password</Text>
              <View style={styles.iptWrap}>
                <Feather name="lock" size={18} color={theme.purple} style={{ marginRight: 11 }} />
                <TextInput
                  style={styles.ipt}
                  value={current}
                  onChangeText={setCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.meta}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>New password</Text>
          <View style={styles.iptWrap}>
            <Feather name="lock" size={18} color={theme.purple} style={{ marginRight: 11 }} />
            <TextInput
              style={styles.ipt}
              value={next}
              onChangeText={setNext}
              placeholder="Enter new password"
              placeholderTextColor={theme.meta}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.hint}>Use at least 6 characters.</Text>

          <Text style={styles.label}>Confirm new password</Text>
          <View style={styles.iptWrap}>
            <Feather name="lock" size={18} color={theme.purple} style={{ marginRight: 11 }} />
            <TextInput
              style={styles.ipt}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter new password"
              placeholderTextColor={theme.meta}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={[styles.btn, busy && { opacity: 0.5 }]} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Save password</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(21,19,15,0.4)' },
  panel: { width: '78%', maxWidth: 320, backgroundColor: theme.surface, flex: 1 },

  head: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.divider },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: theme.purpleSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarTxt: { color: theme.purpleInk, fontWeight: '800', fontSize: 18 },
  name: { fontSize: 17, fontWeight: '700', color: theme.ink },
  candId: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: theme.purpleInk, marginTop: 2 },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 3 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 15 },
  rowTxt: { flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.ink2 },

  foot: { fontSize: 11.5, color: theme.meta, textAlign: 'center', paddingVertical: 14 },

  sheetWrap: { flex: 1, backgroundColor: 'rgba(21,19,15,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 6,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: theme.ink },
  close: { fontSize: 26, lineHeight: 28, color: theme.meta, paddingHorizontal: 4 },

  label: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, marginTop: 14, marginBottom: 6 },
  iptWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15,
  },
  ipt: { flex: 1, fontSize: 14, color: theme.ink, paddingVertical: 14 },
  hint: { fontSize: 12, color: theme.meta, marginTop: 6, marginLeft: 2 },

  btn: { backgroundColor: theme.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
