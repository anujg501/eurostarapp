import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';
import { theme } from '../theme';

type CheckIn = { id: string; type: 'in' | 'out'; lat: number; lng: number; accuracy?: number; address?: string; at: string };

function fmt(at: string) {
  const d = new Date(at);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CheckInScreen() {
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'in' | 'out' | null>(null);
  const [place, setPlace] = useState('');

  const load = useCallback(async () => {
    try {
      setHistory(await api.myCheckins());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const last = history[0];
  const lastWasIn = last?.type === 'in';

  const doCheck = useCallback(
    async (type: 'in' | 'out') => {
      setBusy(type);
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Location needed', 'Please allow location so we can record where you checked ' + type + '.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await api.checkin({
          type,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
          address: place.trim() || undefined,
        });
        setPlace('');
        await load();
        Alert.alert(type === 'in' ? 'Checked in ✓' : 'Checked out ✓', 'Your location and time were recorded.');
      } catch (e: any) {
        Alert.alert('Could not check ' + type, e.message || 'Please try again.');
      } finally {
        setBusy(null);
      }
    },
    [place, load]
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.paper }}
      contentContainerStyle={{ padding: 16 }}
      data={history}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        <View>
          <View style={[styles.statusCard, { backgroundColor: lastWasIn ? theme.emerald : theme.surface }]}>
            <Text style={[styles.statusLabel, { color: lastWasIn ? theme.emeraldSoft : theme.ink3 }]}>Current status</Text>
            <Text style={[styles.statusValue, { color: lastWasIn ? theme.paper : theme.ink }]}>
              {lastWasIn ? '🟢 Checked in' : '⚪ Checked out'}
            </Text>
            {last ? (
              <Text style={[styles.statusSub, { color: lastWasIn ? theme.emeraldSoft : theme.ink3 }]}>
                Last: {last.type === 'in' ? 'in' : 'out'} · {fmt(last.at)}{last.address ? ' · ' + last.address : ''}
              </Text>
            ) : (
              <Text style={[styles.statusSub, { color: theme.ink3 }]}>No check-ins yet today.</Text>
            )}
          </View>

          <Text style={styles.fieldLabel}>WHERE ARE YOU? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Zaveri Bazaar, or a customer's shop"
            value={place}
            onChangeText={setPlace}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnIn, (busy || lastWasIn) && styles.btnDisabled]}
              onPress={() => doCheck('in')}
              disabled={!!busy || lastWasIn}
            >
              {busy === 'in' ? <ActivityIndicator color={theme.paper} /> : <Text style={styles.btnInTxt}>Check in</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnOut, (busy || !lastWasIn) && styles.btnDisabled]}
              onPress={() => doCheck('out')}
              disabled={!!busy || !lastWasIn}
            >
              {busy === 'out' ? <ActivityIndicator color={theme.emerald} /> : <Text style={styles.btnOutTxt}>Check out</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.histTitle}>Recent check-ins</Text>
          {loading ? <ActivityIndicator color={theme.emerald} style={{ marginTop: 16 }} /> : null}
        </View>
      }
      ListEmptyComponent={loading ? null : <Text style={styles.muted}>Your check-ins will appear here.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.type === 'in' ? theme.emerald : theme.ink3 }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowType}>{item.type === 'in' ? 'Checked in' : 'Checked out'}</Text>
            <Text style={styles.rowSub}>
              {fmt(item.at)}{item.address ? ' · ' + item.address : ''}
            </Text>
          </View>
          <Text style={styles.rowCoords}>{item.lat.toFixed(3)}, {item.lng.toFixed(3)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  statusCard: { borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border, padding: 18, marginBottom: 18 },
  statusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  statusValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  statusSub: { marginTop: 6, fontSize: 13 },
  fieldLabel: { color: theme.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.ink },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, borderRadius: 99, paddingVertical: 15, alignItems: 'center' },
  btnIn: { backgroundColor: theme.emerald },
  btnInTxt: { color: theme.paper, fontWeight: '800', fontSize: 16 },
  btnOut: { backgroundColor: theme.emeraldSoft, borderWidth: 1, borderColor: theme.emerald },
  btnOutTxt: { color: theme.emeraldInk, fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.45 },
  histTitle: { fontSize: 16, fontWeight: '700', color: theme.ink, marginTop: 26, marginBottom: 6 },
  muted: { color: theme.ink3, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md, padding: 13, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowType: { fontWeight: '700', color: theme.ink },
  rowSub: { color: theme.ink3, fontSize: 12, marginTop: 2 },
  rowCoords: { color: theme.ink3, fontSize: 11, fontFamily: 'monospace' },
});
