import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api, type Payment, type Order } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '');

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: theme.amberSoft, fg: theme.amber, label: 'Awaiting verification' },
  confirmed: { bg: theme.emeraldSoft, fg: theme.emeraldInk, label: 'Verified' },
  failed: { bg: theme.rubySoft, fg: theme.ruby, label: 'Rejected' },
};

/**
 * The payment queue — the office's most time-sensitive job.
 *
 * A rep logs a collection in the field; nothing about the customer's balance
 * moves until someone here verifies it. Confirming marks the order paid and
 * stops the reminders, so the two buttons are deliberately far apart in weight:
 * verifying is the primary action, rejecting asks for a reason first.
 */
export default function PaymentsScreen({ navigation, active = true, onCounts }: any) {
  const [rows, setRows] = useState<Payment[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api.payments().then((p) => setRows(Array.isArray(p) ? p : [])).catch((e) => {
      setErr(e?.message || 'Could not load payments.');
      setRows([]);
    });
    api.orders().then((o) => setOrders(Array.isArray(o) ? o : [])).catch(() => {});
  };

  useEffect(() => { if (active) load(); }, [active]);

  const pending = (rows || []).filter((p) => p.status === 'pending');
  useEffect(() => { if (rows) onCounts?.({ Payments: pending.length }); }, [onCounts, rows, pending.length]);

  const list = useMemo(() => (tab === 'pending' ? pending : rows || []), [tab, rows, pending]);

  const orderFor = (id?: string | null) => orders.find((o) => o.id === id);

  const decide = async (p: Payment, status: 'confirmed' | 'failed') => {
    const go = async (reason?: string) => {
      setBusy(p.id);
      try {
        await api.setPaymentStatus(p.id, status, reason);
        load();
      } catch (e: any) {
        Alert.alert('Could not update that payment', e?.message || 'Please try again.');
      } finally { setBusy(null); }
    };

    if (status === 'confirmed') {
      Alert.alert(
        'Verify this payment?',
        `${money(p.amount)} by ${p.method || 'payment'}${p.orderId ? ` against ${p.orderId}` : ''}. Confirming marks the order paid and stops the customer's reminders.`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Verify', onPress: () => go() }]
      );
    } else {
      Alert.alert(
        'Reject this payment?',
        'The rep will need to log it again. Only reject if the money did not arrive.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', style: 'destructive', onPress: () => go('Not received') }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Payments"
        sub={rows ? `${pending.length} awaiting verification · ${rows.length} logged` : 'loading…'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {([['pending', `Awaiting (${pending.length})`], ['all', `All (${(rows || []).length})`]] as const).map(([k, label]) => {
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
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'pending' ? 'Nothing waiting — every logged payment has been verified.' : 'No payments logged yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const tone = TONE[item.status] || TONE.pending;
            const o = orderFor(item.orderId);
            return (
              <View style={styles.card}>
                <View style={styles.head}>
                  <Text style={styles.amount}>{money(item.amount)}</Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{tone.label}</Text>
                </View>
                <Text style={styles.meta}>
                  {[item.method, item.orderId, when(item.loggedAt)].filter(Boolean).join(' · ')}
                </Text>
                {!!o && (
                  <Text style={styles.meta}>
                    {o.custName || o.customerName || o.customer || 'Customer'} · order {money(o.grand)} · {o.status}
                  </Text>
                )}

                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btn, busy === item.id && { opacity: 0.5 }]}
                      disabled={busy === item.id}
                      onPress={() => decide(item, 'confirmed')}
                    >
                      <Text style={styles.btnTxt}>{busy === item.id ? 'Saving…' : '✓ Verify'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ghost, busy === item.id && { opacity: 0.5 }]}
                      disabled={busy === item.id}
                      onPress={() => decide(item, 'failed')}
                    >
                      <Text style={styles.ghostTxt}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amount: { flex: 1, fontSize: 19, fontWeight: '800', color: theme.ink },
  pill: {
    fontSize: 10.5, fontWeight: '700', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
    overflow: 'hidden', flexShrink: 0,
  },
  meta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, backgroundColor: theme.emerald, borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 9, paddingHorizontal: 18, paddingVertical: 11,
  },
  ghostTxt: { color: theme.ink2, fontSize: 13, fontWeight: '700' },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30, paddingHorizontal: 24, lineHeight: 19 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
