import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking,
} from 'react-native';
import { api, STAGES, type Lead, type Rep } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Leads — the office's side of the pipeline.
 *
 * Two queues matter here: leads nobody owns, and leads flagged because they
 * match a customer already on the books. Both need a decision before a rep can
 * work them, which is why they lead the list rather than sitting in a filter.
 */
export default function LeadsScreen({ navigation, active = true, onCounts }: any) {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'todo' | 'all'>('todo');
  const [assigning, setAssigning] = useState<Lead | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api.leads().then((l) => setRows(Array.isArray(l) ? l : [])).catch((e) => {
      setErr(e?.message || 'Could not load leads.');
      setRows([]);
    });
    api.reps().then((r) => setReps(Array.isArray(r) ? r.filter((x) => x.active !== false) : [])).catch(() => {});
  };

  useEffect(() => { if (active) load(); }, [active]);

  const flagged = (rows || []).filter((l) => (l as any).flagged);
  const unassigned = (rows || []).filter((l) => !(l as any).flagged && !l.rep);
  const todo = useMemo(() => [...flagged, ...unassigned], [rows]);

  useEffect(() => { if (rows) onCounts?.({ Leads: todo.length }); }, [onCounts, rows, todo.length]);

  const list = tab === 'todo' ? todo : rows || [];

  const assign = async (lead: Lead, rep: Rep) => {
    setAssigning(null);
    setBusy(lead.id);
    try {
      await api.assignLead(lead.id, rep.repId);
      load();
    } catch (e: any) {
      Alert.alert('Could not assign that lead', e?.message || 'Please try again.');
    } finally { setBusy(null); }
  };

  const drop = (lead: Lead) => {
    Alert.alert(
      'Discard this lead?',
      `${lead.name} will be removed so no rep prospects it again. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            setBusy(lead.id);
            try { await api.deleteLead(lead.id); load(); }
            catch (e: any) { Alert.alert('Could not discard that lead', e?.message || 'Please try again.'); }
            finally { setBusy(null); }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Leads"
        sub={rows ? `${todo.length} need a decision · ${rows.length} total` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {([['todo', `To assign (${todo.length})`], ['all', `All (${(rows || []).length})`]] as const).map(([k, label]) => {
          const on = tab === k;
          return (
            <TouchableOpacity key={k} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(k)}>
              <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
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
              {tab === 'todo' ? 'Every lead is assigned — nothing waiting on you.' : 'No leads yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const isFlagged = !!(item as any).flagged;
            const stage = STAGES.find((s) => s.id === item.stage);
            const overdue = !!item.rep && item.stage < 6 && !!item.followUp && item.followUp <= TODAY;
            return (
              <View style={[styles.card, isFlagged && { borderColor: theme.amberBorder }]}>
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {isFlagged ? (
                    <Text style={[styles.pill, { backgroundColor: theme.amberSoft, color: theme.amber }]}>Flagged</Text>
                  ) : item.rep ? (
                    <Text style={[styles.pill, { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk }]}>{item.rep}</Text>
                  ) : (
                    <Text style={[styles.pill, { backgroundColor: theme.card, color: theme.meta }]}>Unassigned</Text>
                  )}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.contact, item.city, item.mobile].filter(Boolean).join(' · ') || 'No contact recorded'}
                </Text>
                {isFlagged && !!(item as any).flagName && (
                  <Text style={styles.flagNote}>
                    Matches existing customer {(item as any).flagName}
                    {(item as any).flagBy ? ` under ${(item as any).flagBy}` : ''} — check before assigning.
                  </Text>
                )}
                {!!item.rep && (
                  <Text style={[styles.meta, overdue && { color: theme.ruby, fontWeight: '700' }]}>
                    {stage?.label || `Stage ${item.stage}`}{item.followUp ? ` · follow-up ${item.followUp}` : ''}
                  </Text>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, busy === item.id && { opacity: 0.5 }]}
                    disabled={busy === item.id || reps.length === 0}
                    onPress={() => setAssigning(item)}
                  >
                    <Text style={styles.btnTxt}>{item.rep ? 'Reassign' : 'Assign to rep'}</Text>
                  </TouchableOpacity>
                  {!!item.mobile && (
                    <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(`tel:${item.mobile}`)}>
                      <Text style={styles.ghostTxt}>📞 Call</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.ghost} disabled={busy === item.id} onPress={() => drop(item)}>
                    <Text style={[styles.ghostTxt, { color: theme.ruby }]}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!assigning} transparent animationType="slide" onRequestClose={() => setAssigning(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle} numberOfLines={1}>Assign {assigning?.name}</Text>
              <TouchableOpacity onPress={() => setAssigning(null)}><Text style={styles.close}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>Assign by city so nobody sits idle.</Text>
            {reps.map((r) => (
              <TouchableOpacity key={r.repId} style={styles.repRow} onPress={() => assigning && assign(assigning, r)}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
                  <Text style={styles.meta}>{[r.repId, r.region].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </TouchableOpacity>
            ))}
            {reps.length === 0 && <Text style={styles.empty}>No active reps to assign to.</Text>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingVertical: 12 },
  tab: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  tabOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  tabTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  tabTxtOn: { color: '#fff', fontWeight: '700' },

  pad: { paddingHorizontal: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
    overflow: 'hidden', flexShrink: 0, maxWidth: 130,
  },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },
  flagNote: { fontSize: 12.5, color: theme.amber, marginTop: 6, lineHeight: 18 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  btnTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12.5, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 26, maxHeight: '75%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.ink },
  sheetSub: { fontSize: 12.5, color: theme.meta, marginTop: 2, marginBottom: 10 },
  close: { fontSize: 18, color: theme.meta, paddingHorizontal: 6 },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.divider },
  chev: { fontSize: 20, color: theme.meta, flexShrink: 0 },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, paddingHorizontal: 24, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
