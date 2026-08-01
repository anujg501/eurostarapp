import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useCandidate, LMS_PASS_PCT } from '../state';
import MiraFab from '../components/MiraFab';
import MenuDrawer from '../components/MenuDrawer';
import CandBell from '../components/CandBell';

// Mirrors LMS_JOURNEY in the web candidate UI (docs/lms/lms/lms-data.jsx) —
// same order, icons, copy and hues, so the app and the web flow read alike.
const JOURNEY: { id: string; label: string; icon: string; hue: number; desc: string; screen: string }[] = [
  { id: 'apply', label: 'Apply Now', icon: '📋', hue: 220, desc: 'Submit your application', screen: 'Apply' },
  { id: 'status', label: 'My Status', icon: '🎯', hue: 32, desc: 'Track your progress', screen: 'Status' },
  { id: 'training', label: 'Training', icon: '📗', hue: 142, desc: 'Watch training videos', screen: 'Training' },
  { id: 'test', label: 'Take Test', icon: '📝', hue: 270, desc: 'Clear the assessment', screen: 'Test' },
  { id: 'result', label: 'My Result', icon: '📊', hue: 8, desc: 'See your score', screen: 'Result' },
];

export default function DashboardScreen({ navigation, onSignOut }: any) {
  const { cand } = useCandidate();
  const [menuOpen, setMenuOpen] = useState(false);

  const locked = (id: string) => {
    if (id === 'apply' || id === 'status') return false;
    if (id === 'training' || id === 'test') return !cand.applied;
    if (id === 'result') return cand.score == null;
    return false;
  };

  const banner = !cand.applied
    ? { bg: theme.purpleSoft, border: '#DDD0F5', ink: theme.purpleInk, text: 'Start by submitting your application.' }
    : cand.score == null
    ? { bg: theme.greenSoft, border: '#C4DFCE', ink: theme.greenInk, text: 'Application received. Finish training, then take the assessment.' }
    : cand.score >= LMS_PASS_PCT
    ? { bg: theme.greenSoft, border: '#C4DFCE', ink: theme.greenInk, text: `You scored ${cand.score}% — recommended for hiring! 🎉` }
    : { bg: '#FCEBC8', border: '#EAD9AE', ink: '#8A6314', text: `You scored ${cand.score}%. Keep learning and try again.` };

  const firstName = cand.name ? cand.name.split(' ')[0] : '';

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      {/* .cand-appbar — menu button, title, and "Hey <name> 👋 · EC-####" */}
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity
            style={styles.menu}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Menu"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="menu" size={18} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.sub}>
              {firstName ? `Hey ${firstName} 👋` : 'Hey 👋'}
              {cand.candId ? (
                <>
                  {' · '}
                  <Text style={styles.candId}>{cand.candId}</Text>
                </>
              ) : null}
            </Text>
          </View>
          <CandBell candId={cand.candId} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: banner.bg, borderColor: banner.border }]}>
          <Text style={[styles.bannerTxt, { color: banner.ink }]}>{banner.text}</Text>
        </View>

        {/* .cand-tiles — a two-column grid, not a list of rows */}
        <View style={styles.tiles}>
          {JOURNEY.map((t) => {
            const isLocked = locked(t.id);
            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={isLocked ? 1 : 0.7}
                style={[styles.tile, isLocked && styles.tileLocked]}
                onPress={() => !isLocked && navigation.navigate(t.screen)}
              >
                {isLocked && (
                  <View style={styles.lock}>
                    <Feather name="lock" size={12} color="#C77F1A" />
                  </View>
                )}
                <View style={[styles.tic, { backgroundColor: `hsl(${t.hue}, 70%, 94%)` }]}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                </View>
                <Text style={styles.tname}>{t.label}</Text>
                <Text style={styles.tdesc}>{t.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.confid}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={styles.confidTxt}>
            <Text style={{ fontWeight: '700' }}>Confidential.</Text> All prices, product data, training material
            and customer information shown here are the property of Eurostar. Sharing, copying, screenshotting or
            forwarding any of it to outsiders is strictly prohibited.
          </Text>
        </View>
      </ScrollView>

      <MiraFab who={cand.name || undefined} />
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} onSignOut={onSignOut} />
    </View>
  );
}

// Values mirror .cand-appbar / .cand-tiles / .cand-tile in docs/lms/lms/lms.css.
const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  menu: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
    flexShrink: 0,
  },
  title: { fontSize: 17, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12, color: theme.meta, marginTop: 1 },
  candId: { fontFamily: 'monospace', color: theme.purpleInk, fontWeight: '700' },

  // .cand-pad, plus the mobile rule's clearance for the Mira pill
  // The width cap keeps the two-column tile grid readable on a tablet or in
  // landscape, where full-bleed cards stretched into wide, empty slabs.
  pad: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 96, backgroundColor: theme.paper, flexGrow: 1,
    width: '100%', maxWidth: 620, alignSelf: 'center',
  },

  banner: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 13, marginBottom: 16 },
  bannerTxt: { fontSize: 13, lineHeight: 19 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: {
    // Fixed half-width, never flexGrow: with five tiles the last one would
    // stretch across the whole row instead of sitting in the left column.
    width: '47%', minHeight: 120,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 18,
    padding: 18, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tileLocked: { opacity: 0.62 },
  tic: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tname: { fontSize: 15, fontWeight: '600', color: theme.ink },
  tdesc: { fontSize: 12, color: theme.meta, lineHeight: 17 },
  lock: {
    position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: 7,
    backgroundColor: '#FFF1DC', alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },

  confid: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 18,
    borderWidth: 1, borderColor: '#E6C9C9', backgroundColor: '#FBF1F1', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  confidTxt: { flex: 1, fontSize: 12, color: '#9A3B3B', lineHeight: 18 },
});
