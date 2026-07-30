import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';
import { useCandidate } from '../state';

type Notif = { id: string; icon?: string; text: string; time?: string };

export default function NotificationsScreen({ navigation }: any) {
  const { cand } = useCandidate();
  const candId = cand.candId;
  const [items, setItems] = useState<Notif[] | null>(null);

  useEffect(() => {
    if (!candId) { setItems([]); return; }
    let alive = true;
    api.candNotifs()
      .then((m) => { if (alive) setItems((m && m[candId]) || []); })
      .catch(() => { if (alive) setItems([]); });
    // Opening the page marks everything read (the badge clears).
    return () => { alive = false; };
  }, [candId]);

  // Once loaded, persist all ids as read so the bell badge clears.
  useEffect(() => {
    if (!candId || !items) return;
    AsyncStorage.setItem('eurostar_lms_notif_read_' + candId, JSON.stringify(items.map((n) => n.id))).catch(() => {});
  }, [items, candId]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Feather name="chevron-left" size={20} color={theme.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.sub}>Updates from the Eurostar hiring team</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.pad}>
        {items === null ? (
          <ActivityIndicator color={theme.purple} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 34 }}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyTxt}>You'll see updates here when the office schedules your screening, unlocks training, or shares a decision.</Text>
          </View>
        ) : (
          items.map((n) => (
            <View key={n.id} style={styles.row}>
              <Text style={styles.icon}>{n.icon || '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{n.text}</Text>
                {!!n.time && <Text style={styles.time}>{n.time}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.divider },
  back: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  title: { fontSize: 17, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12, color: theme.meta, marginTop: 1 },
  pad: { paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.divider },
  icon: { fontSize: 18 },
  text: { fontSize: 13.5, color: theme.ink2, lineHeight: 19 },
  time: { fontSize: 11, color: theme.meta, marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.ink, marginTop: 12 },
  emptyTxt: { fontSize: 13.5, color: theme.meta, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
