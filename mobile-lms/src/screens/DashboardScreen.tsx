import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useCandidate, LMS_PASS_PCT } from '../state';

const STEPS: { key: string; icon: string; title: string; desc: string; screen: string }[] = [
  { key: 'apply', icon: '📝', title: 'Apply Now', desc: 'Submit your application', screen: 'Apply' },
  { key: 'status', icon: '📍', title: 'My Status', desc: 'Track your progress', screen: 'Status' },
  { key: 'training', icon: '🎬', title: 'Training', desc: 'Watch the modules', screen: 'Training' },
  { key: 'test', icon: '🧪', title: 'Assessment', desc: `Clear ≥ ${LMS_PASS_PCT}% to qualify`, screen: 'Test' },
  { key: 'result', icon: '🏆', title: 'Result', desc: 'See your score', screen: 'Result' },
];

export default function DashboardScreen({ navigation, onSignOut }: any) {
  const { cand } = useCandidate();

  const locked = (key: string) => {
    if (key === 'status' || key === 'apply') return false;
    if (key === 'training' || key === 'test') return !cand.applied;
    if (key === 'result') return cand.score == null;
    return false;
  };

  const banner = !cand.applied
    ? { tone: theme.purpleSoft, ink: theme.purpleInk, text: 'Start by submitting your application.' }
    : cand.score == null
    ? { tone: theme.greenSoft, ink: theme.green, text: 'Application received. Finish training, then take the assessment.' }
    : cand.score >= LMS_PASS_PCT
    ? { tone: theme.greenSoft, ink: theme.green, text: `You scored ${cand.score}% — recommended for hiring! 🎉` }
    : { tone: '#FCEBC8', ink: '#8A6314', text: `You scored ${cand.score}%. Keep learning and try again.` };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <SafeAreaView edges={['top']} style={styles.head}>
        <View style={styles.headRow}>
          <Text style={styles.brand}>Eurostar Academy</Text>
          <TouchableOpacity onPress={onSignOut}><Text style={styles.signout}>Sign out</Text></TouchableOpacity>
        </View>
        <Text style={styles.hello}>Hi{cand.name ? ' ' + cand.name.split(' ')[0] : ''} 👋</Text>
        <Text style={styles.sub}>Field Sales Representative — recruitment</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={[styles.banner, { backgroundColor: banner.tone }]}>
          <Text style={[styles.bannerTxt, { color: banner.ink }]}>{banner.text}</Text>
        </View>

        {STEPS.map((s) => {
          const isLocked = locked(s.key);
          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={isLocked ? 1 : 0.7}
              style={[styles.card, isLocked && styles.cardLocked]}
              onPress={() => !isLocked && navigation.navigate(s.screen)}
            >
              <Text style={styles.cardIcon}>{s.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardDesc}>{isLocked ? 'Complete the earlier steps to unlock' : s.desc}</Text>
              </View>
              <Text style={styles.chev}>{isLocked ? '🔒' : '›'}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.confidential}>
          <Text style={styles.confTxt}>
            <Text style={{ fontWeight: '800' }}>Confidential.</Text> All training material and company
            information is Eurostar property. Sharing or forwarding it to outsiders is strictly prohibited.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: theme.bgMid, paddingHorizontal: 18, paddingBottom: 16 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  brand: { color: theme.gold, fontSize: 18, fontWeight: '700' },
  signout: { color: theme.onDarkMeta, fontWeight: '600', fontSize: 13 },
  hello: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12 },
  sub: { color: theme.onDarkMeta, fontSize: 13, marginTop: 2 },
  banner: { borderRadius: theme.radius.lg, padding: 14, marginBottom: 16 },
  bannerTxt: { fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12, gap: 14 },
  cardLocked: { opacity: 0.55 },
  cardIcon: { fontSize: 26 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.ink },
  cardDesc: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  chev: { fontSize: 22, color: theme.meta },
  confidential: { backgroundColor: '#FBEDED', borderRadius: theme.radius.md, padding: 13, marginTop: 8 },
  confTxt: { fontSize: 11.5, color: theme.maroonInk, lineHeight: 17 },
});
