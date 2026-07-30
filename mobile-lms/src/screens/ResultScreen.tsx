import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useCandidate, LMS_PASS_PCT } from '../state';

export default function ResultScreen({ navigation }: any) {
  const { cand } = useCandidate();
  const score = cand.score ?? 0;
  // The office sets the pass mark; the server told us what it was when it marked
  // the paper, so use that rather than a baked-in 70.
  const passPct = cand.passPct ?? LMS_PASS_PCT;
  const passed = score >= passPct;

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: passed ? theme.greenSoft : '#FCEBC8' }]}>
        <Text style={styles.badgeIcon}>{passed ? '🏆' : '📚'}</Text>
      </View>

      <Text style={styles.score}>{score}%</Text>
      <Text style={[styles.verdict, { color: passed ? theme.green : '#8A6314' }]}>
        {passed ? 'Passed — recommended for hiring!' : `Not cleared (need ≥ ${passPct}%)`}
      </Text>

      <Text style={styles.desc}>
        {passed
          ? 'Congratulations! Your result has been shared with the Eurostar office. They will reach out with the next steps and your Rep ID.'
          : 'Don’t worry — revisit the training modules and try the assessment again when you’re ready.'}
      </Text>

      <View style={styles.actions}>
        {!passed && (
          <TouchableOpacity style={styles.retry} onPress={() => navigation.replace('Training')}>
            <Text style={styles.retryTxt}>Back to training</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Status')}>
          <Text style={styles.ctaTxt}>View my status</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.home}>← Back to home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  badge: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { fontSize: 54 },
  score: { fontSize: 52, fontWeight: '900', color: theme.ink, marginTop: 18 },
  verdict: { fontSize: 17, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  desc: { fontSize: 14, color: theme.meta, textAlign: 'center', marginTop: 14, lineHeight: 21 },
  actions: { alignSelf: 'stretch', marginTop: 28, gap: 10 },
  cta: { backgroundColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
  retry: { borderWidth: 1, borderColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center' },
  retryTxt: { color: theme.purpleInk, fontWeight: '700', fontSize: 15 },
  home: { color: theme.meta, marginTop: 22, fontSize: 14, fontWeight: '600' },
});
