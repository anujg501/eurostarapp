import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useCandidate, LMS_PASS_PCT } from '../state';

const STAGES = [
  { key: 'applied', label: 'Application', desc: 'Your details are submitted.' },
  { key: 'screening', label: 'Screening', desc: 'A quick call to know you better.' },
  { key: 'training', label: 'Training', desc: 'Watch all modules to unlock the test.' },
  { key: 'testing', label: 'Assessment', desc: `Clear ≥ ${LMS_PASS_PCT}% to be recommended.` },
  { key: 'recommended', label: 'Recommended', desc: 'Awaiting the final hiring decision.' },
];

export default function StatusScreen() {
  const { cand } = useCandidate();

  // Which stages are done, based on the candidate's progress.
  const reachedIndex = (() => {
    if (cand.score != null && cand.score >= LMS_PASS_PCT) return 4;
    if (cand.score != null) return 3;
    if (cand.applied) return 2;
    return 0;
  })();

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Your progress</Text>
      <Text style={styles.sub}>Track where you are in the recruitment journey.</Text>

      <View style={{ marginTop: 20 }}>
        {STAGES.map((s, i) => {
          const done = i < reachedIndex;
          const active = i === reachedIndex;
          return (
            <View key={s.key} style={styles.row}>
              <View style={styles.railCol}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                  <Text style={styles.dotTxt}>{done ? '✓' : i + 1}</Text>
                </View>
                {i < STAGES.length - 1 && <View style={[styles.rail, done && styles.railDone]} />}
              </View>
              <View style={styles.body}>
                <Text style={[styles.stageLabel, (done || active) && { color: theme.ink }]}>{s.label}</Text>
                <Text style={styles.stageDesc}>{s.desc}</Text>
                {active && <Text style={styles.badge}>In progress</Text>}
                {cand.score != null && s.key === 'testing' && (
                  <Text style={styles.score}>Your score: {cand.score}%</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 13.5, color: theme.meta, marginTop: 4 },
  row: { flexDirection: 'row', gap: 14 },
  railCol: { alignItems: 'center', width: 34 },
  dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: theme.green, borderColor: theme.green },
  dotActive: { borderColor: theme.purple },
  dotTxt: { fontWeight: '800', color: theme.meta, fontSize: 13 },
  rail: { width: 2, flex: 1, minHeight: 34, backgroundColor: theme.border, marginVertical: 2 },
  railDone: { backgroundColor: theme.green },
  body: { flex: 1, paddingBottom: 22 },
  stageLabel: { fontSize: 16, fontWeight: '700', color: theme.meta },
  stageDesc: { fontSize: 12.5, color: theme.meta, marginTop: 3, lineHeight: 18 },
  badge: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: theme.purpleSoft, color: theme.purpleInk, fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  score: { marginTop: 6, color: theme.green, fontWeight: '700', fontSize: 13 },
});
