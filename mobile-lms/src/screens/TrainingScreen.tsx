import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';
import { useCandidate } from '../state';
import MiraFab from '../components/MiraFab';

type Vid = { id: string; title: string; dur?: string; url?: string };
type Mod = { id: string; code: string; title: string; videos: Vid[]; notes: string[] };

// Shown when the back room has no modules configured yet, so training still
// works. Mirrors the web candidate course (docs/lms/lms/lms-data.jsx).
const FALLBACK: Mod[] = [
  {
    id: 'M1', code: 'M1', title: 'Welcome to Eurostar',
    videos: [{ id: 'v1', title: 'Who we are — 40 years of trust', dur: '04:00' }],
    notes: [
      'Eurostar has supplied the jewellery trade since 1980 — 40+ years; authorised distributor for the Asia-Pacific region.',
      'We sell to manufacturers & wholesalers, NOT the public — the people who set our stones into rings, pendants and bangles.',
      'Our three promises: consistent quality · consistent sizing · reliable supply.',
      'Two-sentence intro to memorise: "I’m from Eurostar. We’ve supplied calibrated stones to the trade since 1980 — moissanite, zirconia, pearls, natural stones — all in matched sizes, ready for casting."',
      'The one big idea behind everything: specials open the door → the relationship builds trust → White Round Zirconia is the goal.',
    ],
  },
  {
    id: 'M2', code: 'M2', title: 'The Product Range — Overview',
    videos: [{ id: 'v2', title: 'Product families & the four ways we sell', dur: '10:00' }],
    notes: [
      'The four ways we sell: Piece (pc) · Carat (ct, by weight) · Packet (pkt) · Strip.',
      'Packet model: the pieces inside one packet change with size — small size = many pieces, big size = few.',
      'Carat is used for moissanite, lab-grown and beads; strip is used for Multi Sapphire.',
      'Our families at a glance: showpieces (moissanite, HD zirconia, alpanite, lab-grown), everyday workhorses (Colour CZ, pearls, MOP, corundums, cabochons, navratnas), and the volume core — White Round CZ.',
    ],
  },
  {
    id: 'M3', code: 'M3', title: 'Product Knowledge — Deep Dive',
    videos: [{ id: 'v3', title: 'Know every product — grade by grade', dur: '16:00' }],
    notes: [
      'White Round is your volume — but big business often comes from the OTHER products. Know them all and pitch what fits the customer.',
      'MOISSANITE: diamond alternative, extreme sparkle & hardness. Colour grades DEF and GH; clarity VVS. Sold by carat; larger stones by piece.',
      'HD (HIGH DENSITY) ZIRCONIA: ~25% heavier than normal CZ for the same size — gives gold jewellers more gross weight.',
      'ALPANITE: Eurostar’s proprietary wax-castable coloured synthetics — full colour range, economical.',
      'LAB-GROWN / CREATED gems: IGI-certifiable, real gemstone properties at a fraction of natural cost.',
      'COLOUR CZ: calibrated cubic zirconia in 80+ heat-stable shades — the everyday workhorse across all metals.',
      'Golden habit: match the product to the customer’s metal, budget and product line. Every category is a chance for a big order.',
    ],
  },
  {
    id: 'M4', code: 'M4', title: 'Hero Product — White Round CZ',
    videos: [{ id: 'v4', title: 'The grades & the metal-first decision tree', dur: '12:00' }],
    notes: [
      'White Round CZ is the centre of our business — your steady volume and commission. Know it cold.',
      'Ask the METAL first — it drives the whole grade choice.',
      'GOLD (gross wt): HD Zirconia → Elements H/HH/HEA → GQ. GOLD (net wt): Elements Thin/Normal, GQ, Euro AAA, Laser.',
      'SILVER: GQ → Euro AAA → Prizma → Eternal → Rajkot.',
      'BRASS (imitation): Rajkot Silver / Shampoo Packet only.',
      'Grades finest → cheapest: Eurostar Laser Engraved · Elements · GQ · Euro AAA · Prizma · Eternal · Rajkot.',
      'Pitch: fully castable, withstands 1000°C+, doesn’t break in hand setting. Invite a small trial — never attack the competitor.',
    ],
  },
  {
    id: 'M5', code: 'M5', title: 'Knowing Your Customer',
    videos: [{ id: 'v5', title: 'Who buys, and what they care about', dur: '07:00' }],
    notes: [
      'Our customers are manufacturers & wholesalers — they buy to set & resell, not to wear.',
      'They judge on cost per piece, consistency across a bulk order, and casting behaviour — not retail display.',
      'Premium gold & diamond houses → Elements / Euro AAA, Moissanite, IGI lab-grown.',
      'Fine & mid gold / premium silver → GQ, Euro AAA, Prizma.',
      'Mass silver & imitation → Prizma, Eternal, Alpanite economy, Rajkot Zirconia.',
      'Golden listening rule: in the first meeting, ask and listen more than you talk.',
    ],
  },
  {
    id: 'M6', code: 'M6', title: 'Marketing & Building Your Territory',
    videos: [{ id: 'v6', title: 'Finding customers & covering your market', dur: '09:00' }],
    notes: [],
  },
  {
    id: 'M7', code: 'M7', title: 'The Eurostar Selling Strategy',
    videos: [{ id: 'v7', title: 'Relationship first, white round next', dur: '09:00' }],
    notes: [],
  },
];

export default function TrainingScreen({ navigation }: any) {
  const { cand, markWatched } = useCandidate();
  const [mods, setMods] = useState<Mod[] | null>(null);

  useEffect(() => {
    api.modules()
      .then((list) => {
        // An empty list is a real answer, not a failure: it means the office
        // has not published any modules yet. Showing the built-in demo course
        // instead would tell the candidate to study material nobody assigned.
        // FALLBACK is only for "we could not reach the back room at all".
        if (!list) { setMods(FALLBACK); return; }
        // The back room stores one video per module; the screen groups them the
        // same way the web course does.
        setMods(
          list.map((m, i) => ({
            id: m.id,
            code: `M${i + 1}`,
            title: m.title,
            videos: (m.summary || m.videoUrl)
              ? [{ id: m.id, title: m.summary || m.title, dur: m.videoDuration || undefined, url: m.videoUrl || undefined }]
              : [],
            notes: m.checklist || [],
          }))
        );
      })
      .catch(() => setMods(FALLBACK));
  }, []);

  if (!mods) {
    return <View style={styles.center}><ActivityIndicator color={theme.purple} size="large" /></View>;
  }

  const allVids = mods.flatMap((m) => m.videos.map((v) => v.id));
  const watchedCount = allVids.filter((id) => cand.watched.includes(id)).length;
  const allDone = allVids.length > 0 && watchedCount === allVids.length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Feather name="chevron-left" size={20} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.appbarTitle}>Training</Text>
            <Text style={styles.appbarSub}>{watchedCount}/{allVids.length} watched</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.confid}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={styles.confidTxt}>
            <Text style={{ fontWeight: '700' }}>Confidential training material.</Text> Do not record,
            screenshot, download or share these videos or any company data with anyone outside Eurostar.
            Violation will lead to <Text style={{ fontWeight: '700' }}>termination and legal action</Text>.
          </Text>
        </View>

        {mods.map((m) => (
          <View key={m.id} style={{ marginBottom: 18 }}>
            <View style={styles.modHead}>
              <View style={styles.tag}><Text style={styles.tagTxt}>{m.code}</Text></View>
              <Text style={styles.modTitle}>{m.title}</Text>
            </View>

            {m.videos.map((v) => {
              const done = cand.watched.includes(v.id);
              return (
                <View key={v.id} style={styles.vid}>
                  <TouchableOpacity
                    style={[styles.play, done && styles.playDone]}
                    onPress={() => v.url && Linking.openURL(v.url)}
                    disabled={!v.url}
                  >
                    <Feather name="play" size={18} color="#fff" />
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.vidTitle}>{v.title}</Text>
                    <Text style={styles.vidMeta}>{v.dur ? `${v.dur} · Mandatory` : 'Mandatory'}</Text>
                  </View>

                  {done ? (
                    <View style={styles.watchedPill}><Text style={styles.watchedTxt}>✓ Watched</Text></View>
                  ) : (
                    <TouchableOpacity style={styles.markBtn} onPress={() => markWatched(v.id)}>
                      <Text style={styles.markTxt}>Mark watched</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {m.notes.length > 0 && (
              <View style={styles.notes}>
                <Text style={styles.notesHead}>📝  MODULE NOTES</Text>
                {m.notes.map((n, i) => (
                  <View key={i} style={styles.noteRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.noteTxt}>{n}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${allVids.length ? (watchedCount / allVids.length) * 100 : 0}%` }]} />
        </View>

        {allDone ? (
          <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaTxt}>✓ Training complete — back to dashboard</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>
            Watch all videos to complete training. The test unlocks separately when the office opens it.
          </Text>
        )}
      </ScrollView>

      <MiraFab who={cand.name || undefined} />
    </View>
  );
}

// Mirrors .cand-appbar / .cand-vid / .cand-notes / .lms-tag-mod in lms.css.
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  appbarSub: { fontSize: 12, color: theme.meta, marginTop: 1 },

  pad: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 96, backgroundColor: theme.surface },

  confid: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 16,
    borderWidth: 1, borderColor: '#E6C9C9', backgroundColor: '#FBF1F1', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  confidTxt: { flex: 1, fontSize: 12, color: '#9A3B3B', lineHeight: 18 },

  modHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tag: { backgroundColor: '#EDEAE2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt: { fontSize: 11.5, fontWeight: '600', color: theme.ink2 },
  modTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.ink },

  // .cand-vid
  vid: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.green, alignItems: 'center', justifyContent: 'center' },
  playDone: { backgroundColor: '#9A6B12' },
  vidTitle: { fontSize: 14, fontWeight: '600', color: theme.ink },
  vidMeta: { fontSize: 12, color: theme.meta, marginTop: 2 },
  watchedPill: { backgroundColor: theme.greenSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  watchedTxt: { fontSize: 11, fontWeight: '700', color: theme.greenInk },
  markBtn: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.surface,
  },
  markTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2 },

  // .cand-notes
  notes: {
    backgroundColor: theme.greenSoft, borderWidth: 1, borderColor: '#C9E3D3', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
  },
  notesHead: {
    fontSize: 11, fontWeight: '700', color: theme.greenInk,
    letterSpacing: 0.6, marginBottom: 8,
  },
  noteRow: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  bullet: { fontSize: 12.5, color: theme.ink2, lineHeight: 19 },
  noteTxt: { flex: 1, fontSize: 12.5, color: theme.ink2, lineHeight: 19 },

  bar: { height: 8, backgroundColor: '#EEEBE3', borderRadius: 8, overflow: 'hidden', marginTop: 6, marginBottom: 14 },
  barFill: { height: 8, backgroundColor: theme.green },

  cta: { backgroundColor: theme.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: 12.5, color: theme.meta, lineHeight: 18 },
});
