import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Modal, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type Announcement } from '../api';
import { theme } from '../theme';

// Shown once per app run, as the web shows it once per browser session. Module
// state rather than storage: reopening the app is a new visit and should show
// the current campaign again.
//
// DISMISSED only flips once something has actually been on screen and closed.
// Flagging at the start of the fetch instead would lose the pop-up entirely
// whenever the root remounted mid-flight — the fetch would be marked done
// before anything had been shown.
let DISMISSED = false;
// The decision is made once and shared, so a remount re-reads the answer rather
// than asking the server again.
let PENDING: Promise<Decision> | null = null;

type Decision =
  | { kind: 'none' }
  | { kind: 'splash'; image: string }
  | { kind: 'broadcast'; ann: Announcement; token: string };

// The rep broadcast has its own rule — once a day, and again on every re-push —
// so it is remembered under the same key the web console uses.
const ANN_KEY = 'eurostar-rep-announce-seen';
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Whatever the office is showing on opening — and who is looking decides which.
 *
 * A customer gets the marketing pop-up from Admin > Marketing. A rep or the
 * back office signing into this app gets the field broadcast instead, the same
 * one the CRM shows them, because the marketing artwork is aimed at buyers and
 * a rep opening the shop is not one.
 */
/** Who is looking, and what the office has switched on for them. */
async function decide(): Promise<Decision> {
  const me = await api.me().catch(() => null);
  const staff = me?.role === 'rep' || me?.role === 'office';

  if (staff) {
    try {
      const a = await api.announcement();
      if (!a?.active) return { kind: 'none' };
      const d = today();
      const start = a.windowStart ? String(a.windowStart).slice(0, 10) : null;
      const end = a.windowEnd ? String(a.windowEnd).slice(0, 10) : null;
      const inWindow = (!start || d >= start) && (!end || d <= end);
      if (!inWindow || !(a.image || a.message || a.title)) return { kind: 'none' };
      // Date plus updatedAt, so an edited message reappears instead of being
      // swallowed by an earlier dismissal.
      const token = `${d}|${a.updatedAt || ''}`;
      const seen = await AsyncStorage.getItem(ANN_KEY);
      return seen === token ? { kind: 'none' } : { kind: 'broadcast', ann: a, token };
    } catch {
      return { kind: 'none' }; // a broadcast that cannot be fetched is not shown
    }
  }

  try {
    const s = await api.splash();
    return s?.active && s.image ? { kind: 'splash', image: s.image } : { kind: 'none' };
  } catch {
    return { kind: 'none' };
  }
}

export default function SplashPopup() {
  const [uri, setUri] = useState<string | null>(null);
  const [ratio, setRatio] = useState(1);
  const [ann, setAnn] = useState<(Announcement & { token: string }) | null>(null);

  useEffect(() => {
    if (DISMISSED) return;
    let alive = true;
    PENDING = PENDING || decide();
    PENDING.then((d) => {
      if (!alive || DISMISSED) return;
      if (d.kind === 'splash') {
        setUri(d.image);
        // Show the artwork whole at its own proportions — a fixed box would
        // letterbox a tall poster or crop a wide one.
        Image.getSize(d.image, (w, h) => { if (w && h) setRatio(w / h); }, () => {});
      } else if (d.kind === 'broadcast') {
        setAnn({ ...d.ann, token: d.token });
      }
    });
    return () => { alive = false; };
  }, []);

  if (ann) {
    const dismiss = async () => {
      DISMISSED = true;
      try { await AsyncStorage.setItem(ANN_KEY, ann.token); } catch {}
      setAnn(null);
    };
    return (
      <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.annCard}>
            <TouchableOpacity style={styles.close} onPress={dismiss} accessibilityLabel="Close">
              <Text style={styles.closeTxt}>×</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!!ann.image && <Image source={{ uri: ann.image }} style={styles.annImg} resizeMode="contain" />}

              {(ann.title || ann.message || ann.badge) && (
                <View style={styles.annBody}>
                  <Text style={styles.eyebrow}>📣 FOR THE TEAM</Text>
                  {!!ann.title && <Text style={styles.annTitle}>{ann.title}</Text>}
                  {!!ann.message && <Text style={styles.annMsg}>{ann.message}</Text>}
                  {!!ann.badge && (
                    <View style={styles.badge}>
                      <Text style={{ fontSize: 24 }}>🎉</Text>
                      <Text style={styles.badgeTxt}>{ann.badge}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.annFoot}>
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

  if (!uri) return null;

  const close = () => { DISMISSED = true; setUri(null); };
  const win = Dimensions.get('window');
  const width = Math.min(win.width - 40, 520);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
        <TouchableOpacity style={[styles.frame, { width }]} activeOpacity={1}>
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: ratio, maxHeight: win.height * 0.8 }}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.close} onPress={close} accessibilityLabel="Close">
            <Text style={styles.closeTxt}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(21,19,15,0.74)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  frame: {
    backgroundColor: theme.surface, borderRadius: theme.radius.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 }, elevation: 16,
  },
  close: {
    position: 'absolute', top: 12, right: 12, zIndex: 2,
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(21,19,15,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 22, lineHeight: 26 },

  // Rep broadcast — laid out as the CRM lays it out, so one message reads the
  // same to a rep whichever app they opened.
  annCard: {
    width: '100%', maxWidth: 420, maxHeight: '90%',
    backgroundColor: theme.surface, borderRadius: 18, overflow: 'hidden',
  },
  annImg: { width: '100%', height: 220, backgroundColor: theme.ink },
  annBody: { backgroundColor: theme.emerald, paddingHorizontal: 26, paddingTop: 26, paddingBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: 'rgba(245,231,196,0.9)', fontWeight: '800', marginBottom: 12 },
  annTitle: { fontSize: 24, lineHeight: 30, color: '#FDFAF2', fontWeight: '700' },
  annMsg: { fontSize: 15, lineHeight: 24, color: 'rgba(253,250,242,0.9)', marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,231,196,0.14)', borderWidth: 1, borderColor: 'rgba(245,231,196,0.4)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  badgeTxt: { fontSize: 15, fontWeight: '700', color: '#F5E7C4', flexShrink: 1 },
  annFoot: { padding: 16, alignItems: 'center', backgroundColor: theme.surface },
  btn: { backgroundColor: theme.emerald, borderRadius: 10, paddingHorizontal: 30, paddingVertical: 12 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
