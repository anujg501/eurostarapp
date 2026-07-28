import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../theme';
import { useCandidate } from '../state';

// Sample assessment. In production the office manages the question bank; this
// v0.1 ships a representative set so the candidate can complete the journey.
const QUESTIONS: { q: string; options: string[]; answer: number }[] = [
  { q: 'What is the minimum order value in the Sales App?', options: ['₹500', '₹1,000', '₹5,000', 'No minimum'], answer: 1 },
  { q: 'How do beads sell?', options: ['Per piece', 'Per carat, 100 ct minimum', 'Per packet only', 'Per gram'], answer: 1 },
  { q: 'When a rep checks out of a visit, who receives the OTP?', options: ['The rep', 'The office', 'The customer', 'Nobody'], answer: 2 },
  { q: 'Everyone starts on which payment terms?', options: ['NET 30', 'Credit', 'Cash (pay then ship)', 'Advance 50%'], answer: 2 },
  { q: 'What is the pass mark for this assessment?', options: ['50%', '60%', '70%', '90%'], answer: 2 },
];

export default function TestScreen({ navigation }: any) {
  const { setScore } = useCandidate();
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(answers).length;

  function submit() {
    if (answeredCount < QUESTIONS.length) {
      Alert.alert('Please answer all questions', `${QUESTIONS.length - answeredCount} left.`);
      return;
    }
    const correct = QUESTIONS.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
    const score = Math.round((correct / QUESTIONS.length) * 100);
    setScore(score);
    navigation.replace('Result');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18 }}>
      <View style={styles.head}>
        <Text style={styles.headTitle}>Certification assessment</Text>
        <Text style={styles.headSub}>{QUESTIONS.length} questions · answer all to submit</Text>
      </View>

      {QUESTIONS.map((q, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.q}>{i + 1}. {q.q}</Text>
          {q.options.map((opt, oi) => {
            const picked = answers[i] === oi;
            return (
              <TouchableOpacity
                key={oi}
                style={[styles.opt, picked && styles.optOn]}
                onPress={() => setAnswers((a) => ({ ...a, [i]: oi }))}
              >
                <View style={[styles.radio, picked && styles.radioOn]}>{picked && <View style={styles.radioDot} />}</View>
                <Text style={[styles.optTxt, picked && styles.optTxtOn]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <TouchableOpacity style={styles.cta} onPress={submit}>
        <Text style={styles.ctaTxt}>Submit assessment ({answeredCount}/{QUESTIONS.length})</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: 16 },
  headTitle: { fontSize: 20, fontWeight: '800', color: theme.ink },
  headSub: { fontSize: 13, color: theme.meta, marginTop: 3 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12 },
  q: { fontSize: 15, fontWeight: '700', color: theme.ink, marginBottom: 12, lineHeight: 21 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md, padding: 12, marginBottom: 8 },
  optOn: { borderColor: theme.purple, backgroundColor: theme.purpleSoft },
  optTxt: { fontSize: 14, color: theme.ink2, flex: 1 },
  optTxtOn: { color: theme.purpleInk, fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: theme.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.purple },
  cta: { backgroundColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
});
