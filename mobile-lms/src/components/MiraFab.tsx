import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { api } from '../api';
import { theme } from '../theme';

type Msg = { role: 'user' | 'assistant'; text: string };

const GREETING: Msg = {
  role: 'assistant',
  text: 'Hi 👋 I’m Mira. Ask me anything about applying to Eurostar — registration, training, the assessment, or where you are in the process.',
};

// The floating "Ask Mira" pill from the web candidate UI (mira-staff.js), plus
// the chat sheet it opens. Talks to POST /assistant/chat with app: 'lms'.
export default function MiraFab({ who }: { who?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [kbd, setKbd] = useState(false);
  const session = useRef('LMS-' + Date.now().toString(36));
  const list = useRef<ScrollView>(null);

  // The pill is anchored to the bottom-right, which is exactly where the
  // keyboard puts the field being typed into — so it stands down while typing.
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKbd(true));
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKbd(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    setMsgs((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const r = await api.chat(session.current, text, who);
      setMsgs((m) => [...m, { role: 'assistant', text: r.reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: 'assistant', text: e.message || 'Mira is unavailable right now. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!kbd && (
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setOpen(true)}>
        <Text style={styles.fabIcon}>💬</Text>
        <Text style={styles.fabTxt}>Ask Mira</Text>
      </TouchableOpacity>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.panel}
          >
            <View style={styles.head}>
              <View style={styles.avatar}><Text style={{ fontSize: 18 }}>💎</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headTitle}>Mira · Eurostar Academy</Text>
                <Text style={styles.headSub}>Ask me about this app</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.close}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={list}
              style={{ flex: 1 }}
              contentContainerStyle={styles.msgs}
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            >
              {msgs.map((m, i) => (
                <View key={i} style={[styles.bubble, m.role === 'user' ? styles.mine : styles.theirs]}>
                  <Text style={m.role === 'user' ? styles.mineTxt : styles.theirsTxt}>{m.text}</Text>
                </View>
              ))}
              {busy && (
                <View style={[styles.bubble, styles.theirs]}>
                  <ActivityIndicator color={theme.mira} size="small" />
                </View>
              )}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask about this app…"
                placeholderTextColor="#8a8372"
                returnKeyType="send"
                onSubmitEditing={send}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={busy}>
                <Text style={styles.sendTxt}>➤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 22, bottom: 22, height: 52, borderRadius: 999,
    paddingLeft: 16, paddingRight: 20, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: theme.mira,
    shadowColor: theme.mira, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabIcon: { fontSize: 20, lineHeight: 22 },
  fabTxt: { color: '#FDFAF2', fontWeight: '600', fontSize: 15 },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.35)', justifyContent: 'flex-end' },
  panel: { height: '86%', backgroundColor: theme.miraPaper, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.mira, paddingHorizontal: 15, paddingVertical: 13 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headTitle: { color: '#FDFAF2', fontWeight: '700', fontSize: 15 },
  headSub: { color: 'rgba(253,250,242,0.8)', fontSize: 11.5 },
  close: { color: '#FDFAF2', fontSize: 24, lineHeight: 26, paddingHorizontal: 4 },

  msgs: { padding: 14, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.mira },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6ddcb' },
  mineTxt: { color: '#FDFAF2', fontSize: 13.7, lineHeight: 20 },
  theirsTxt: { color: '#2a2620', fontSize: 13.7, lineHeight: 20 },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderTopWidth: 1, borderTopColor: '#ece6da', backgroundColor: theme.miraPaper },
  composerInput: {
    flex: 1, minWidth: 0, paddingHorizontal: 13, paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    borderRadius: 999, borderWidth: 1, borderColor: '#d8d2c4', backgroundColor: '#fff', color: '#2a2620', fontSize: 14,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.mira, alignItems: 'center', justifyContent: 'center' },
  sendTxt: { color: '#fff', fontSize: 17 },
});
