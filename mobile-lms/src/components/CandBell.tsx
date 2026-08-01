import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { theme } from '../theme';

// Bell in the candidate app bar — shows an unread count and opens the full
// Notifications page (a separate screen, not a dropdown).
export default function CandBell({ candId }: { candId?: string | null }) {
  const navigation = useNavigation<any>();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!candId) return;
    let alive = true;
    const pull = async () => {
      try {
        const m = await api.candNotifs();
        const items = (m && m[candId]) || [];
        const raw = await AsyncStorage.getItem('eurostar_lms_notif_read_' + candId);
        const read: string[] = raw ? JSON.parse(raw) : [];
        if (alive) setCount(items.filter((n) => !read.includes(n.id)).length);
      } catch { /* ignore */ }
    };
    pull();
    const iv = setInterval(pull, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [candId]);

  return (
    <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications">
      <Feather name="bell" size={18} color={theme.ink} />
      {count > 0 && (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{count}</Text></View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bell: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, flexShrink: 0 },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: theme.purple, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
