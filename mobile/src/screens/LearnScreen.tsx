import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, TrainingModule, Candidate } from '../api';
import { theme } from '../theme';

type Tab = 'training' | 'recruit';

const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  training: 'Training',
  test: 'Test',
  recommended: 'Recommended',
  hired: 'Hired',
  rejected: 'Rejected',
};
const STAGE_COLOR: Record<string, string> = {
  applied: '#7A6F5C',
  screening: '#1E3A8A',
  training: '#B7791F',
  test: '#B7791F',
  recommended: '#0E5C4A',
  hired: '#3E8E4F',
  rejected: '#8B1E2E',
};

// Progress is stored on the phone (no per-rep training endpoint yet), keyed by module.
const PROGRESS_KEY = 'eurostar_learn_progress_v1';

export default function LearnScreen() {
  const [tab, setTab] = useState<Tab>('training');
  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <View style={styles.segment}>
        <SegBtn label="Training" on={tab === 'training'} onPress={() => setTab('training')} />
        <SegBtn label="Recruitment" on={tab === 'recruit'} onPress={() => setTab('recruit')} />
      </View>
      {tab === 'training' ? <Training /> : <Recruit />}
    </View>
  );
}

function SegBtn({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.seg, on && styles.segOn]} onPress={onPress}>
      <Text style={[styles.segTxt, on && styles.segTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------- Training modules (LMS rep learning) ----------
function Training() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mods, raw] = await Promise.all([api.modules(), AsyncStorage.getItem(PROGRESS_KEY)]);
      setModules(mods);
      setDone(raw ? JSON.parse(raw) : {});
    } catch (e: any) {
      setError(e.message || 'Could not load training.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (key: string) => {
      setDone((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  if (loading) return <Center />;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={modules}
      keyExtractor={(m) => m.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListEmptyComponent={<Text style={styles.muted}>{error || 'No training modules yet.'}</Text>}
      renderItem={({ item, index }) => {
        const expanded = open === item.id;
        const total = item.checklist.length;
        const doneCount = item.checklist.filter((_, i) => done[`${item.id}:${i}`]).length;
        return (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setOpen(expanded ? null : item.id)} activeOpacity={0.7}>
              <View style={styles.cardHead}>
                <View style={styles.numDot}>
                  <Text style={styles.numTxt}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modTitle}>{item.title}</Text>
                  {item.summary ? <Text style={styles.modSummary}>{item.summary}</Text> : null}
                  {total > 0 ? (
                    <Text style={styles.progress}>
                      {doneCount}/{total} steps done
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chev}>{expanded ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {expanded ? (
              <View style={styles.expand}>
                {item.videoUrl ? (
                  <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(item.videoUrl!)}>
                    <Text style={styles.videoTxt}>▶  Watch video</Text>
                  </TouchableOpacity>
                ) : null}
                {item.checklist.map((step, i) => {
                  const key = `${item.id}:${i}`;
                  return (
                    <TouchableOpacity key={key} style={styles.checkRow} onPress={() => toggle(key)}>
                      <View style={[styles.box, done[key] && styles.boxOn]}>
                        {done[key] ? <Text style={styles.tick}>✓</Text> : null}
                      </View>
                      <Text style={[styles.stepTxt, done[key] && styles.stepDone]}>{step}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

// ---------- Recruitment pipeline (candidates) ----------
function Recruit() {
  const [list, setList] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await api.candidates());
    } catch (e: any) {
      setError(e.message || 'Could not load candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Center />;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={list}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        list.length ? <Text style={styles.muted}>{list.length} candidates in the pipeline</Text> : null
      }
      ListEmptyComponent={<Text style={styles.muted}>{error || 'No candidates in the pipeline yet.'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                {item.exp ? ` · ${item.exp}` : ''}
                {item.source ? ` · ${item.source}` : ''}
              </Text>
              {item.phone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                  <Text style={styles.phone}>{item.phone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={[styles.stageChip, { backgroundColor: (STAGE_COLOR[item.stage] || theme.ink3) + '22' }]}>
              <Text style={[styles.stageTxt, { color: STAGE_COLOR[item.stage] || theme.ink3 }]}>
                {STAGE_LABEL[item.stage] || item.stage}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

function Center() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.emerald} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  muted: { color: theme.ink3, marginTop: 8, marginBottom: 8, textAlign: 'center' },
  segment: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: theme.paper },
  seg: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 99, paddingVertical: 10, alignItems: 'center', backgroundColor: theme.surface },
  segOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  segTxt: { color: theme.ink2, fontWeight: '700', fontSize: 14 },
  segTxtOn: { color: theme.paper },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.lg, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  numDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.emeraldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numTxt: { color: theme.emeraldInk, fontWeight: '800' },
  modTitle: { fontWeight: '700', color: theme.ink, fontSize: 16 },
  modSummary: { color: theme.ink3, fontSize: 13, marginTop: 3 },
  progress: { color: theme.emeraldInk, fontSize: 12, marginTop: 6, fontWeight: '700' },
  chev: { color: theme.ink3, marginLeft: 8, marginTop: 2 },
  expand: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14 },
  videoBtn: { backgroundColor: theme.emerald, borderRadius: 99, paddingVertical: 12, alignItems: 'center', marginBottom: 14 },
  videoTxt: { color: theme.paper, fontWeight: '800', fontSize: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: theme.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  tick: { color: theme.paper, fontWeight: '900', fontSize: 13 },
  stepTxt: { flex: 1, color: theme.ink2, fontSize: 14, lineHeight: 20 },
  stepDone: { color: theme.ink3, textDecorationLine: 'line-through' },
  name: { fontWeight: '700', color: theme.ink, fontSize: 16 },
  meta: { color: theme.ink3, fontSize: 12.5, marginTop: 3 },
  phone: { color: theme.emeraldInk, fontSize: 13, marginTop: 4, fontWeight: '600' },
  stageChip: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  stageTxt: { fontWeight: '800', fontSize: 12 },
});
