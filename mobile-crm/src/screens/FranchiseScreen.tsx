import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Switch, Linking,
} from 'react-native';
import { api, type Franchise, type Announcement } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const STATUSES: Franchise['status'][] = ['new', 'contacted', 'closed'];
const LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', closed: 'Closed' };

/**
 * Two things the office owns and nobody else does: partnership enquiries coming
 * off the Sales App, and the broadcast that goes out to every rep's phone.
 *
 * They share a screen because they are both "the office talking to the outside
 * world", and neither is big enough on a phone to earn its own tab.
 */
export default function FranchiseScreen({ navigation, active = true, onCounts }: any) {
  const [rows, setRows] = useState<Franchise[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // The broadcast.
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [badge, setBadge] = useState('');
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.franchise().then((f) => setRows(Array.isArray(f) ? f : [])).catch((e) => {
      setErr(e?.message || 'Could not load franchise requests.');
      setRows([]);
    });
    api.announcement().then((a) => {
      setAnn(a);
      setTitle(a?.title || '');
      setMessage(a?.message || '');
      setBadge(a?.badge || '');
      setLive(!!a?.active);
    }).catch(() => {});
  };

  useEffect(() => { if (active) load(); }, [active]);

  const fresh = (rows || []).filter((r) => r.status === 'new');
  useEffect(() => { if (rows) onCounts?.({ Franchise: fresh.length }); }, [onCounts, rows, fresh.length]);

  const setStatus = async (r: Franchise, status: Franchise['status']) => {
    setBusy(r.id);
    try {
      await api.setFranchiseStatus(r.id, status as 'new' | 'contacted' | 'closed');
      load();
    } catch (e: any) {
      Alert.alert('Could not update that request', e?.message || 'Please try again.');
    } finally { setBusy(null); }
  };

  const saveBroadcast = async () => {
    setSaving(true);
    try {
      await api.saveAnnouncement({
        active: live,
        title: title.trim() || null,
        message: message.trim() || null,
        badge: badge.trim() || null,
      });
      Alert.alert(
        live ? 'Broadcast is live' : 'Broadcast saved',
        live
          ? 'Every rep sees this once the next time they open the app, and again if you edit it.'
          : 'Saved but switched off — reps will not see it.'
      );
      load();
    } catch (e: any) {
      Alert.alert('Could not save the broadcast', e?.message || 'Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Franchise &amp; broadcast"
        sub={rows ? `${fresh.length} new enquiries` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sec}>Franchise requests</Text>
          <Text style={styles.secMeta}>from the Sales App's "Join Franchise" form</Text>

          {rows.length === 0 ? (
            <Text style={styles.empty}>No franchise enquiries yet.</Text>
          ) : (
            rows.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>{r.name || 'Enquiry'}</Text>
                  <Text style={[styles.pill, r.status === 'new'
                    ? { backgroundColor: theme.amberSoft, color: theme.amber }
                    : { backgroundColor: theme.card, color: theme.meta }]}>
                    {LABEL[r.status] || r.status}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {[(r as any).firm, r.city, (r as any).invest].filter(Boolean).join(' · ') || 'No details recorded'}
                </Text>
                {!!(r as any).exp && <Text style={styles.meta}>{(r as any).exp}</Text>}

                <View style={styles.actions}>
                  {!!(r as any).mobile && (
                    <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`tel:${(r as any).mobile}`)}>
                      <Text style={styles.btnTxt}>📞 Call</Text>
                    </TouchableOpacity>
                  )}
                  {STATUSES.filter((s) => s !== r.status).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.ghost, busy === r.id && { opacity: 0.5 }]}
                      disabled={busy === r.id}
                      onPress={() => setStatus(r, s)}
                    >
                      <Text style={styles.ghostTxt}>Mark {LABEL[s].toLowerCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}

          <Text style={styles.sec}>Rep broadcast</Text>
          <Text style={styles.secMeta}>shown once a day on every rep's phone, and again whenever you edit it</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name}>{live ? 'Live to the field' : 'Switched off'}</Text>
                <Text style={styles.meta}>
                  {live ? 'Reps see this when they next open the app.' : 'Saved, but no rep will see it.'}
                </Text>
              </View>
              <Switch
                value={live}
                onValueChange={setLive}
                trackColor={{ true: theme.emerald, false: theme.border }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.label}>TITLE</Text>
            <TextInput style={styles.ipt} value={title} onChangeText={setTitle}
              placeholder="Diwali target announced" placeholderTextColor={theme.meta} />

            <Text style={styles.label}>MESSAGE</Text>
            <TextInput style={[styles.ipt, { height: 96, textAlignVertical: 'top' }]} value={message}
              onChangeText={setMessage} multiline
              placeholder="What the team needs to know" placeholderTextColor={theme.meta} />

            <Text style={styles.label}>BADGE (OPTIONAL)</Text>
            <TextInput style={styles.ipt} value={badge} onChangeText={setBadge}
              placeholder="🎉 Top rep this month: Rohit" placeholderTextColor={theme.meta} />

            <TouchableOpacity style={[styles.save, saving && { opacity: 0.55 }]} onPress={saveBroadcast} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>{live ? 'Push to the field' : 'Save'}</Text>}
            </TouchableOpacity>
            {!!ann?.updatedAt && (
              <Text style={styles.note}>Last pushed {new Date(ann.updatedAt).toLocaleString('en-IN')}</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },
  sec: { fontSize: 14, fontWeight: '800', color: theme.ink, marginTop: 22 },
  secMeta: { fontSize: 12, color: theme.meta, marginTop: 2, marginBottom: 10, lineHeight: 17 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.ink },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
    overflow: 'hidden', flexShrink: 0,
  },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { backgroundColor: theme.emerald, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  btnTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9,
  },
  ghostTxt: { color: theme.ink2, fontSize: 12.5, fontWeight: '700' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: theme.ink,
  },
  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  note: { fontSize: 11.5, color: theme.meta, marginTop: 10, textAlign: 'center' },

  empty: { fontSize: 13, color: theme.meta, paddingVertical: 14 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
