import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type Announcement } from '../api';
import { theme } from '../theme';

const SEEN_KEY = 'eurostar-rep-announce-seen';
const today = () => new Date().toISOString().slice(0, 10);

/**
 * The office's broadcast to the field.
 *
 * Shown once a day, and again whenever the office re-pushes it — the "seen"
 * token is the date plus the announcement's updatedAt, so an edited message
 * reappears rather than being swallowed by an earlier dismissal. Same rule and
 * the same storage key as the web console.
 */
export default function Broadcast() {
  const [ann, setAnn] = useState<(Announcement & { token: string }) | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const a = await api.announcement();
        if (!a?.active) return;

        const d = today();
        const start = a.windowStart ? String(a.windowStart).slice(0, 10) : null;
        const end = a.windowEnd ? String(a.windowEnd).slice(0, 10) : null;
        const inWindow = (!start || d >= start) && (!end || d <= end);
        const hasContent = !!(a.image || a.message || a.title);
        if (!inWindow || !hasContent) return;

        const token = `${d}|${a.updatedAt || ''}`;
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (seen !== token) setAnn({ ...a, token });
      } catch { /* a broadcast that cannot be fetched simply is not shown */ }
    })();
  }, []);

  if (!ann) return null;

  const dismiss = async () => {
    try { await AsyncStorage.setItem(SEEN_KEY, ann.token); } catch {}
    setAnn(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={dismiss} accessibilityLabel="Close">
            <Text style={styles.closeTxt}>×</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!!ann.image && <Image source={{ uri: ann.image }} style={styles.image} resizeMode="contain" />}

            {(ann.title || ann.message || ann.badge) && (
              <View style={styles.body}>
                <Text style={styles.eyebrow}>📣 FOR THE TEAM</Text>
                {!!ann.title && <Text style={styles.title}>{ann.title}</Text>}
                {!!ann.message && <Text style={styles.message}>{ann.message}</Text>}
                {!!ann.badge && (
                  <View style={styles.badge}>
                    <Text style={{ fontSize: 24 }}>🎉</Text>
                    <Text style={styles.badgeTxt}>{ann.badge}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.foot}>
              <TouchableOpacity style={styles.btn} onPress={dismiss}>
                <Text style={styles.btnTxt}>Got it</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.74)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, maxHeight: '90%', backgroundColor: theme.surface, borderRadius: 18, overflow: 'hidden' },
  close: {
    position: 'absolute', top: 12, right: 12, zIndex: 2, width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(21,19,15,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 22, marginTop: -2 },

  image: { width: '100%', height: 220, backgroundColor: theme.ink },
  body: { backgroundColor: theme.emerald, paddingHorizontal: 26, paddingTop: 26, paddingBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: 'rgba(245,231,196,0.9)', fontWeight: '800', marginBottom: 12 },
  title: { fontSize: 24, lineHeight: 30, color: '#FDFAF2', fontWeight: '700' },
  message: { fontSize: 15, lineHeight: 24, color: 'rgba(253,250,242,0.9)', marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,231,196,0.14)', borderWidth: 1, borderColor: 'rgba(245,231,196,0.4)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  badgeTxt: { fontSize: 15, fontWeight: '700', color: '#F5E7C4', flexShrink: 1 },

  foot: { padding: 16, alignItems: 'center', backgroundColor: theme.surface },
  btn: { backgroundColor: theme.emerald, borderRadius: 10, paddingHorizontal: 30, paddingVertical: 12 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
