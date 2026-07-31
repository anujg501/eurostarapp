import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api, Candidate } from '../api';
import { theme } from '../theme';
import { useCandidate, LMS_PASS_PCT } from '../state';
import MiraFab from '../components/MiraFab';

// LMS_STAGES from the web candidate UI, minus "rejected" — the tracker shows
// the journey, not a dead end.
const STEPS = [
  // Registering creates the account; submitting the Apply Now form is what
  // makes it an application. Keep these apart or someone who has only signed
  // up is told they have already applied.
  { id: 'registered', label: 'Registered', color: '#6B7280' },
  { id: 'applied', label: 'Applied', color: '#2563EB' },
  { id: 'screening', label: 'Screening', color: '#7C3AED' },
  { id: 'training', label: 'In Training', color: '#B7791F' },
  { id: 'testing', label: 'Test Taken', color: '#0891B2' },
  { id: 'recommended', label: 'Recommended', color: '#B7791F' },
  { id: 'hired', label: 'Hired', color: '#15803D' },
];

// The back room writes "test" for what the web calls "testing"; treat them as
// the same step rather than failing to find the row.
const normalise = (stage?: string | null) => (stage === 'test' ? 'testing' : stage || 'registered');

// The candidate's TRUE current stage, derived from what actually happened
// (screening result, training/test windows, score, hire) — mirrors
// window.lmsEffectiveStage in docs/lms/lms/lms-data.jsx. The stored `stage`
// field lags, which made the app show "screening" while the office had already
// moved the candidate into training.
function effectiveStage(c: any): string {
  if (!c) return 'registered';
  if (c.stage === 'rejected') return 'rejected';
  if (c.stage === 'hired' || c.repId) return 'hired';
  if (c.score != null && c.score >= LMS_PASS_PCT) return 'recommended';
  if (c.score != null || c.testUnlockedOn || c.testConsumed) return 'testing';
  if (c.unlockedOn || (c.watched || []).length > 0) return 'training';
  if (c.screenResult && c.screenResult !== 'fail') return 'screening';
  return c.city && c.state && c.exp ? 'applied' : 'registered';
}

const HELP_NUMBER = '+91 77100 65480';

export default function StatusScreen({ navigation }: any) {
  const { cand } = useCandidate();
  const [record, setRecord] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.myCandidate()
      .then((c) => alive && setRecord(c))
      .catch(() => {/* fall back to what the app already knows */})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const stage = record ? effectiveStage(record) : normalise(cand.stage);
  const score = record?.score ?? cand.score;
  const repId = record?.repId;
  const candId = record?.candId ?? cand.candId;
  const idx = Math.max(0, STEPS.findIndex((s) => s.id === stage));

  // What the candidate should do next, per stage.
  const NEXT: Record<string, string> = {
    registered: 'Fill in the Apply Now form to submit your application — we cannot review you until you do.',
    applied: 'Our team will review your application and call to schedule a short screening.',
    screening: 'Attend your screening call. Be ready to talk about your experience.',
    training: 'Watch all training videos, then your test will be unlocked.',
    testing: `Clear the test with ≥ ${LMS_PASS_PCT}% to be recommended for hiring.`,
    recommended: 'Awaiting the office’s final hiring decision.',
    hired: 'You’re hired! Use your Rep ID to log in to the Eurostar Sales App.',
  };

  // The right-hand note on the current step.
  const currentNote = (id: string) => {
    if (id === 'hired') return repId || '—';
    if (id === 'testing' && score != null) return `${score}%`;
    return 'In progress';
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Feather name="chevron-left" size={20} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.appbarTitle}>My Status</Text>
            {candId ? <Text style={styles.candId}>{candId}</Text> : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Text style={styles.sub}>Track where you are in the Eurostar hiring journey.</Text>

        {loading && !record ? (
          <ActivityIndicator color={theme.purple} style={{ marginTop: 24 }} />
        ) : (
          STEPS.map((s, i) => {
            const done = i < idx;
            const current = i === idx;
            return (
              <View key={s.id} style={styles.step}>
                <View
                  style={[
                    styles.num,
                    { backgroundColor: done ? theme.green : current ? s.color : '#EEEBE3' },
                  ]}
                >
                  <Text style={[styles.numTxt, !done && !current && { color: theme.meta }]}>
                    {done ? '✓' : i + 1}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.stepHead}>
                    <Text style={[styles.stepLabel, current && { fontWeight: '700' }]}>{s.label}</Text>
                    <Text style={styles.stepNote}>
                      {done ? 'Completed' : current ? currentNote(s.id) : ''}
                    </Text>
                  </View>
                  <Text style={styles.stepState}>
                    {current ? 'You are here' : done ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {NEXT[stage] && (
          <View style={styles.next}>
            <Text style={styles.nextHead}>What's next</Text>
            <Text style={styles.nextTxt}>{NEXT[stage]}</Text>
          </View>
        )}

        <Text style={styles.help}>
          Need help? Call the Eurostar hiring desk: <Text style={styles.helpNum}>{HELP_NUMBER}</Text>
        </Text>
      </ScrollView>

      <MiraFab who={cand.name || undefined} />
    </View>
  );
}

// Mirrors .cand-appbar / .cand-step / .cand-sub in docs/lms/lms/lms.css.
const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  back: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  appbarTitle: { fontSize: 17, fontWeight: '700', color: theme.ink },
  candId: { fontSize: 12, color: theme.meta, marginTop: 1 },

  pad: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 96, backgroundColor: theme.surface },
  sub: { fontSize: 14, color: theme.meta, marginBottom: 14 },

  // .cand-step
  step: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepLabel: { fontSize: 15, fontWeight: '500', color: theme.ink },
  stepNote: { fontSize: 12, color: theme.meta },
  stepState: { fontSize: 12.5, color: theme.meta, marginTop: 1 },

  next: {
    marginTop: 16, backgroundColor: theme.purpleSoft, borderWidth: 1, borderColor: '#DDD0F5',
    borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13,
  },
  nextHead: {
    fontSize: 12, fontWeight: '700', color: theme.purpleInk,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  nextTxt: { fontSize: 13.5, color: theme.ink2, marginTop: 4, lineHeight: 19 },

  help: { marginTop: 12, fontSize: 12.5, color: theme.meta, textAlign: 'center', lineHeight: 18 },
  helpNum: { color: theme.ink, fontWeight: '700' },
});
