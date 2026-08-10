import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, type Attendance } from '../api';
import { theme } from '../theme';

const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_LABEL = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Morning attendance, the desktop flow exactly: a selfie or the day does not
 * count.
 *
 * The photo is the mechanism, not decoration — it is what stops a rep marking
 * present from bed, and it ties to the dress code taught in the LMS. So this
 * opens the front camera directly; there is no "mark present" shortcut, and no
 * gallery picker either, because a picture chosen from the camera roll proves
 * nothing about where the rep is this morning.
 */
export default function CheckIn({ month, onMarked }: { month: Attendance[]; onMarked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState<string | null>(null);

  const today = month.find((a) => a.date === TODAY && a.status === 'present');
  const presentDays = month.filter((a) => a.status === 'present').length;

  const checkIn = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Camera needed',
        'Attendance is marked with a photo, so the app needs the camera. Allow it in Settings → Apps → Eurostar CRM → Permissions.'
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.5,
      base64: true,
      // A full-resolution camera dump would blow past the server's 3 MB cap.
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;

    const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
    setBusy(true);
    try {
      await api.markAttendance(dataUrl);
      setShot(res.assets[0].uri);
      onMarked();
    } catch (e: any) {
      Alert.alert('Could not mark attendance', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (today) {
    return (
      <View style={[styles.card, styles.done]}>
        {shot ? (
          <Image source={{ uri: shot }} style={styles.shot} />
        ) : (
          // The photo is not re-fetched on reload — it is heavy — so show a
          // badge rather than a broken image, as the desktop does.
          <View style={styles.badge}><Text style={styles.badgeTxt}>✓</Text></View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.doneTitle}>✓ Checked in — present today</Text>
          <Text style={styles.meta}>
            {today.time ? `${today.time} · ` : ''}marked present for {TODAY_LABEL}
          </Text>
          <Text style={styles.meta}>{presentDays} day{presentDays === 1 ? '' : 's'} present this month</Text>
        </View>
      </View>
    );
  }

  return (
    // Deliberately a column: the copy is a paragraph, and sitting it beside the
    // button squeezed it into a ribbon two words wide.
    <View style={[styles.card, styles.todo]}>
      <Text style={styles.todoTitle}>📸 Morning check-in required</Text>
      <Text style={styles.todoSub}>
        Take a photo to mark attendance before heading to the field. No check-in = marked{' '}
        <Text style={{ fontWeight: '700' }}>absent</Text> for today. You must be dressed as per dressing
        norms mentioned to you in the LMS training platform.
      </Text>
      <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={checkIn} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Check in with photo</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
  // The "done" state is a short line beside a thumbnail, so it stays a row.
  todo: { backgroundColor: theme.rubySoft, borderColor: theme.rubyBorder },
  done: { backgroundColor: theme.emeraldSoft, borderColor: '#B8C6E4', flexDirection: 'row', alignItems: 'center', gap: 13 },

  todoTitle: { fontSize: 15, fontWeight: '700', color: theme.ruby },
  todoSub: { fontSize: 13, color: theme.ink2, marginTop: 6, lineHeight: 19 },
  btn: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 14, marginTop: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },

  shot: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: theme.emeraldInk, flexShrink: 0 },
  badge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: theme.emeraldInk,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badgeTxt: { color: '#F5EFDD', fontSize: 22, fontWeight: '800' },
  doneTitle: { fontSize: 14, fontWeight: '700', color: theme.emeraldInk },
  meta: { fontSize: 12, color: theme.meta, marginTop: 2 },
});
