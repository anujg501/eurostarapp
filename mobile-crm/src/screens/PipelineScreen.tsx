import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { api, STAGES, type Lead } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TODAY = new Date().toISOString().slice(0, 10);

// Relation-Pipeline, the rep's half of it: every lead on their book, which
// stage it sits at, and when it is next due. The board on the web is six
// columns wide; a phone gets the same six stages as a filter rail instead.
//
// Moving a lead forward writes straight to the same endpoint the web CRM uses,
// so a stage changed here is the stage the office sees.
export default function PipelineScreen({ navigation, route, active = true, onCounts }: any) {
  const role: string = route?.params?.role || 'rep';
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [err, setErr] = useState('');
  const [stage, setStage] = useState<number | 'due' | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.leads()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setErr(e?.message || 'Could not load the pipeline.'); setRows([]); });
  }, []);

  useEffect(() => { if (active) load(); }, [active, load]);

  const due = useMemo(
    () => (rows || []).filter((l) => l.stage < 6 && !!l.followUp && l.followUp <= TODAY),
    [rows]
  );

  const list = useMemo(() => {
    if (!rows) return [];
    if (stage === 'all') return rows;
    if (stage === 'due') return due;
    return rows.filter((l) => l.stage === stage);
  }, [rows, stage, due]);

  useEffect(() => { if (rows) onCounts?.({ Pipeline: due.length }); }, [onCounts, rows, due.length]);

  // Advance a lead one stage. The server graduates it into the customer master
  // on "Met & added customer", so say so when that happens.
  const advance = async (l: Lead) => {
    if (l.stage >= 6) return;
    setBusy(l.id);
    try {
      const next = await api.updateLead(l.id, { stage: l.stage + 1 });
      setRows((rs) => (rs || []).map((r) => (r.id === l.id ? { ...r, ...next } : r)));
      const added = (next as any)?.addedCustomer;
      if (added) Alert.alert('Customer created', `${l.name} is now on the customer master as ${added}.`);
    } catch (e: any) {
      Alert.alert('Could not move that lead', e?.message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Pipeline & follow-ups"
        sub={rows ? `${list.length} of ${rows.length} · ${due.length} due today` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ k: 'all' as const, label: 'All' }, { k: 'due' as const, label: `Due (${due.length})` },
                 ...STAGES.map((s) => ({ k: s.id, label: s.short }))]}
          keyExtractor={(f) => String(f.k)}
          contentContainerStyle={{ gap: 7, paddingHorizontal: 18 }}
          renderItem={({ item }) => {
            const on = stage === item.k;
            return (
              <TouchableOpacity style={[styles.filter, on && styles.filterOn]} onPress={() => setStage(item.k)}>
                <Text style={[styles.filterTxt, on && styles.filterTxtOn]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {stage === 'all' ? 'Nothing on your pipeline yet. Leads the office assigns you appear here.' : 'Nothing at this stage.'}
            </Text>
          }
          renderItem={({ item }) => {
            const s = STAGES.find((x) => x.id === item.stage);
            const overdue = item.stage < 6 && !!item.followUp && item.followUp <= TODAY;
            return (
              <View style={[styles.card, overdue && { borderColor: theme.rubyBorder }]}>
                <View style={styles.cardHead}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.pill, item.stage === 6 ? styles.pillDone : overdue ? styles.pillLate : styles.pillOn]}>
                    {s?.short || `Stage ${item.stage}`}
                  </Text>
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.contact, item.city].filter(Boolean).join(' · ') || 'No contact recorded'}
                </Text>
                {!!item.followUp && (
                  <Text style={[styles.follow, overdue && { color: theme.ruby, fontWeight: '700' }]}>
                    {overdue ? 'Follow-up due' : 'Next follow-up'} · {item.followUp}
                  </Text>
                )}
                {!!item.note && <Text style={styles.note} numberOfLines={2}>{item.note}</Text>}

                <View style={styles.actions}>
                  {!!item.mobile && (
                    <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`tel:${item.mobile}`)}>
                      <Text style={styles.btnTxt}>📞 Call</Text>
                    </TouchableOpacity>
                  )}
                  {!!item.mobile && (
                    <TouchableOpacity
                      style={styles.btnGhost}
                      onPress={() => Linking.openURL(`https://wa.me/91${String(item.mobile).replace(/\D/g, '').slice(-10)}`)}
                    >
                      <Text style={styles.btnGhostTxt}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {item.stage < 6 && (
                    <TouchableOpacity
                      style={[styles.btnGhost, busy === item.id && { opacity: 0.5 }]}
                      disabled={busy === item.id}
                      onPress={() => advance(item)}
                    >
                      <Text style={styles.btnGhostTxt}>
                        {busy === item.id ? 'Saving…' : `Move to ${STAGES.find((x) => x.id === item.stage + 1)?.short} →`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterWrap: { paddingVertical: 12, backgroundColor: theme.paper },
  filter: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  filterOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  filterTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  filterTxtOn: { color: '#fff', fontWeight: '700' },

  pad: { paddingHorizontal: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 11, fontWeight: '700', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden', flexShrink: 0,
  },
  pillOn: { backgroundColor: theme.card, color: theme.ink2 },
  pillLate: { backgroundColor: theme.rubySoft, color: theme.ruby },
  pillDone: { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },
  follow: { fontSize: 12.5, color: theme.ink2, marginTop: 5 },
  note: { fontSize: 12.5, color: theme.meta, marginTop: 5, fontStyle: 'italic' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  btnGhostTxt: { color: theme.ink2, fontSize: 12, fontWeight: '700' },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
