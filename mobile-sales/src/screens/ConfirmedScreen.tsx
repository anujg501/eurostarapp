import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Order placed — the storefront's confirmation, with the same three figures. */
export default function ConfirmedScreen({ navigation, route }: any) {
  const { id, grand, dispatchBy, terms, name } = route.params || {};

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Orders" who={name} />

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.tick}>
            <Feather name="check" size={32} color={theme.paper} />
          </View>
          <Text style={styles.h1}>Order placed</Text>
          <Text style={styles.p}>
            Thank you{name ? `, ${name}` : ''}. Your order is confirmed and with our team.
          </Text>

          <Text style={styles.id}>{id}</Text>

          <View style={styles.figures}>
            <Fig label="TOTAL" value={money(grand)} />
            <Fig label="DISPATCH BY" value={dispatchBy || '—'} />
            <Fig label="TERMS" value={terms || '—'} />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.secondaryTxt}>Continue browsing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.primaryTxt}>View your orders</Text>
          </TouchableOpacity>
        </View>

        <ShopFooter />
      </ScrollView>

      <Mira role="customer" section="Order placed" />
    </View>
  );
}

const Fig = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fig}>
    <Text style={styles.figLbl}>{label}</Text>
    <Text style={styles.figVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 16, padding: 30, alignItems: 'center',
  },
  tick: {
    width: 66, height: 66, borderRadius: 33, backgroundColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  h1: { fontFamily: 'serif', fontSize: 29, color: theme.ink, textAlign: 'center' },
  p: { fontSize: 14, color: theme.meta, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  id: { fontFamily: 'monospace', fontSize: 19, fontWeight: '700', color: theme.ink, marginVertical: 16 },

  figures: {
    flexDirection: 'row', backgroundColor: theme.paper, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 10, width: '100%',
  },
  fig: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  figLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7, color: theme.meta },
  figVal: { fontFamily: 'serif', fontSize: 16, color: theme.ink, marginTop: 5, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondary: {
    flex: 1, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  secondaryTxt: { fontSize: 14, fontWeight: '700', color: theme.ink },
  primary: { flex: 1, backgroundColor: theme.emerald, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
