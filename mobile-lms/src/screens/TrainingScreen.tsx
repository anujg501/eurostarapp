import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { api, TrainingModule } from '../api';
import { theme } from '../theme';
import { useCandidate } from '../state';

// Shown if the back room has no modules configured yet, so the flow still works.
const FALLBACK: TrainingModule[] = [
  { id: 'm1', title: 'Welcome to Eurostar', summary: 'Who we are and what we sell — CZ, moissanite & coloured gemstones.', videoUrl: '', checklist: [] },
  { id: 'm2', title: 'The product range', summary: 'Categories, grades, shapes and how customers order.', videoUrl: '', checklist: [] },
  { id: 'm3', title: 'Selling & field visits', summary: 'Check-in/out, logging payments and building trust.', videoUrl: '', checklist: [] },
];

export default function TrainingScreen({ navigation }: any) {
  const { cand, markWatched } = useCandidate();
  const [mods, setMods] = useState<TrainingModule[] | null>(null);

  useEffect(() => {
    api.modules()
      .then((m) => setMods(m && m.length ? m : FALLBACK))
      .catch(() => setMods(FALLBACK));
  }, []);

  if (!mods) {
    return <View style={styles.center}><ActivityIndicator color={theme.purple} size="large" /></View>;
  }

  const done = mods.every((m) => cand.watched.includes(m.id));
  const watchedCount = mods.filter((m) => cand.watched.includes(m.id)).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 18 }}>
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>{watchedCount} / {mods.length} modules watched</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(watchedCount / mods.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.confidential}>
        <Text style={styles.confTxt}>
          <Text style={{ fontWeight: '800' }}>Confidential training material.</Text> Do not record,
          screenshot or share these videos or any company data with anyone outside Eurostar.
        </Text>
      </View>

      {mods.map((m, i) => {
        const watched = cand.watched.includes(m.id);
        return (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.num}><Text style={styles.numTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                {!!m.summary && <Text style={styles.cardSummary}>{m.summary}</Text>}
              </View>
              {watched && <Text style={styles.check}>✓</Text>}
            </View>
            <View style={styles.actions}>
              {!!m.videoUrl && (
                <TouchableOpacity style={styles.playBtn} onPress={() => Linking.openURL(m.videoUrl!)}>
                  <Text style={styles.playTxt}>▶ Watch video</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.markBtn, watched && styles.markBtnDone]}
                onPress={() => markWatched(m.id)}
                disabled={watched}
              >
                <Text style={[styles.markTxt, watched && { color: theme.green }]}>
                  {watched ? 'Completed' : 'Mark as watched'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.cta, !done && styles.ctaOff]}
        onPress={() => done && navigation.replace('Test')}
        disabled={!done}
      >
        <Text style={styles.ctaTxt}>{done ? 'Continue to assessment →' : 'Watch all modules to unlock the test'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressCard: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 14 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 10 },
  bar: { height: 8, backgroundColor: theme.paper, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: theme.green, borderRadius: 999 },
  confidential: { backgroundColor: '#FBEDED', borderRadius: theme.radius.md, padding: 12, marginBottom: 16 },
  confTxt: { fontSize: 11.5, color: theme.maroonInk, lineHeight: 17 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border, padding: 14, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: theme.purpleInk, fontWeight: '800', fontSize: 13 },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: theme.ink },
  cardSummary: { fontSize: 12.5, color: theme.meta, marginTop: 3, lineHeight: 18 },
  check: { color: theme.green, fontSize: 20, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  playBtn: { backgroundColor: theme.purpleSoft, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  playTxt: { color: theme.purpleInk, fontWeight: '700', fontSize: 13 },
  markBtn: { flex: 1, borderWidth: 1, borderColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 9, alignItems: 'center' },
  markBtnDone: { borderColor: theme.green, backgroundColor: theme.greenSoft },
  markTxt: { color: theme.purpleInk, fontWeight: '700', fontSize: 13 },
  cta: { backgroundColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  ctaOff: { backgroundColor: theme.border },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
});
