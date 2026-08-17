import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';

type Msg = { role: 'user' | 'assistant'; text: string };

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer', rep: 'Sales Rep', office: 'Back Office', admin: 'Administration',
};

// The web keeps the last dozen turns as context. More than that and the prompt
// grows without making the answer better.
const HISTORY = 12;

/**
 * Mira — the assistant the storefront carries on every page, as "Ask Mira"
 * bottom-right.
 *
 * She is told which screen the question came from, so "is this in stock?" is
 * answered about what the customer is looking at. Each completed turn is pushed
 * to the back room as a clean question/answer pair, which is what puts a real
 * customer conversation in front of the office in Mira Admin.
 *
 * `app: 'sales'` on the request is what selects the customer-facing body of
 * knowledge — the same call from the CRM gets the staff one.
 */
export default function Mira({ role, section }: { role: string; section: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  // One session id per app run, as the web does — it groups the turns together
  // for whoever reads them later.
  const session = useMemo(() => `SHOP-${Date.now().toString(36).toUpperCase()}`, []);
  const who = `${ROLE_LABEL[role] || role} (Sales app)`;

  const send = useCallback(async () => {
    const q = draft.trim();
    if (!q || busy) return;

    setDraft('');
    setBusy(true);
    const next: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);

    // Hand Mira the recent turns so a follow-up like "and then?" makes sense.
    const history = next
      .slice(-HISTORY)
      .map((m) => `${m.role === 'user' ? 'Staff' : 'Mira'}: ${m.text}`)
      .join('\n');

    let answer = '';
    try {
      const r = await api.ask(
        `${q}\n\nConversation so far:\n${history}`,
        `Eurostar Sales app — ${ROLE_LABEL[role] || role}, ${section} screen`,
        session,
        who
      );
      answer = (r?.reply || '').trim() || 'No answer came back.';
    } catch (e: any) {
      answer = `⚠ ${e?.message || 'Could not reach Mira just now. Please try again.'}`;
    }

    setMsgs((m) => [...m, { role: 'assistant', text: answer }]);
    setBusy(false);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);

    // Only log a real answer — a connection error is not something the office
    // needs to read back in Mira Admin.
    if (!answer.startsWith('⚠')) api.logChat(session, who, q, answer).catch(() => {});
  }, [draft, busy, msgs, role, section, session, who]);

  return (
    <>
      {!open && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Ask Mira"
        >
          {/* A monochrome bubble, not the 💬 emoji — the emoji renders in the
              phone's own colours and sat blue on the emerald pill. */}
          <Feather name="message-circle" size={19} color="#FDFAF2" />
          <Text style={styles.fabTxt}>Ask Mira</Text>
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.panel}
          >
            <View style={styles.head}>
              <View style={styles.avatar}><Text style={{ fontSize: 17 }}>💎</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title}>Mira · Eurostar</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {ROLE_LABEL[role] || role} · {section}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel="Close">
                <MaterialIcons name="close" size={22} color="#FDFAF2" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scroller}
              style={{ flex: 1 }}
              contentContainerStyle={styles.msgs}
              keyboardShouldPersistTaps="handled"
            >
              {msgs.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Ask me anything</Text>
                  <Text style={styles.emptyTxt}>
                    Sizes, grades, what is in stock, how an order ships — ask in plain words.
                  </Text>
                </View>
              )}

              {msgs.map((m, i) => (
                <View key={i} style={[styles.bubble, m.role === 'user' ? styles.mine : styles.hers]}>
                  <Text style={m.role === 'user' ? styles.mineTxt : styles.hersTxt}>{m.text}</Text>
                </View>
              ))}

              {busy && (
                <View style={[styles.bubble, styles.hers, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <ActivityIndicator size="small" color={theme.emerald} />
                  <Text style={styles.hersTxt}>Thinking…</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask about this app…"
                placeholderTextColor={theme.meta}
                multiline
                onSubmitEditing={send}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.send, (!draft.trim() || busy) && { opacity: 0.45 }]}
                onPress={send}
                disabled={!draft.trim() || busy}
                accessibilityLabel="Send"
              >
                <MaterialIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Same metrics as the web pill: 52 tall, 16/20 padding, 9 gap, fully round,
  // 15px semibold on emerald with a soft emerald shadow.
  fab: {
    position: 'absolute', right: 22, bottom: 22, zIndex: 90,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    height: 52, paddingLeft: 16, paddingRight: 20, borderRadius: 999,
    backgroundColor: theme.emerald,
    shadowColor: theme.emerald, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  fabTxt: { color: '#FDFAF2', fontSize: 15, fontWeight: '600' },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  panel: {
    height: '86%', backgroundColor: theme.card,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden',
  },

  head: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 15, paddingVertical: 13, backgroundColor: theme.emerald,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { color: '#FDFAF2', fontSize: 15, fontWeight: '700' },
  sub: { color: 'rgba(253,250,242,0.8)', fontSize: 11.5, marginTop: 1 },

  msgs: { padding: 14, gap: 10 },
  empty: { paddingVertical: 24, paddingHorizontal: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 6 },
  emptyTxt: { fontSize: 13, color: theme.meta, lineHeight: 20 },

  bubble: { maxWidth: '88%', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.emerald, borderBottomRightRadius: 4 },
  mineTxt: { color: '#fff', fontSize: 14, lineHeight: 20 },
  hers: {
    alignSelf: 'flex-start', backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 4,
  },
  hersTxt: { color: theme.ink, fontSize: 14, lineHeight: 20 },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 11, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: theme.divider, backgroundColor: theme.card,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 21,
    paddingHorizontal: 15, paddingTop: 11, paddingBottom: 11,
    fontSize: 14.5, color: theme.ink,
  },
  send: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
