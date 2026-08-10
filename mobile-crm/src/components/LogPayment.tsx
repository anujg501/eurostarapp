import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { api, type Order, type NewPayment } from '../api';
import { theme } from '../theme';

const MODES: NewPayment['mode'][] = ['cash', 'upi', 'neft', 'cheque', 'card'];
const LABEL: Record<string, string> = { cash: 'Cash', upi: 'UPI', neft: 'NEFT', cheque: 'Cheque', card: 'Card' };
const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

/**
 * Record a collection from the field — the desktop's "Log payment".
 *
 * Whether it lands confirmed or pending is the server's decision, never this
 * form's, so nothing here declares an order paid. The back office verifies it
 * from the payment queue, which is what stops the reminders.
 */
export default function LogPayment({
  visible, orders, preset, onClose, onLogged,
}: {
  visible: boolean;
  orders: Order[];
  preset?: Order | null;
  onClose: () => void;
  onLogged?: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(preset ?? null);
  const [mode, setMode] = useState<NewPayment['mode']>('cash');
  const [amount, setAmount] = useState(preset?.grand ? String(Math.round(preset.grand)) : '');
  const [utr, setUtr] = useState('');
  const [busy, setBusy] = useState(false);

  // Opening against a specific overdue order should arrive pre-filled with it.
  React.useEffect(() => {
    if (!visible) return;
    setOrder(preset ?? null);
    setAmount(preset?.grand ? String(Math.round(preset.grand)) : '');
    setMode('cash');
    setUtr('');
  }, [visible, preset]);

  const close = () => onClose();

  const save = async () => {
    const value = parseInt(amount.replace(/\D/g, ''), 10);
    if (!value || value <= 0) { Alert.alert('Enter the amount collected'); return; }
    setBusy(true);
    try {
      await api.logPayment({
        orderId: order?.id,
        custName: order?.custName || order?.customerName || order?.customer,
        mode,
        amount: value,
        utr: utr.trim() || undefined,
      });
      Alert.alert(
        'Payment logged',
        `${money(value)} by ${LABEL[mode]} recorded${order ? ` against ${order.id}` : ''}. The back office verifies it from the payment queue.`
      );
      onLogged?.();
      close();
    } catch (e: any) {
      Alert.alert('Could not log that payment', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Log payment</Text>
            <TouchableOpacity onPress={close} accessibilityLabel="Close"><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>AGAINST WHICH ORDER</Text>
            <View style={styles.wrapRow}>
              <TouchableOpacity style={[styles.pick, !order && styles.pickOn]} onPress={() => setOrder(null)}>
                <Text style={[styles.pickTxt, !order && styles.pickTxtOn]}>On account</Text>
              </TouchableOpacity>
              {orders.slice(0, 8).map((o) => {
                const on = order?.id === o.id;
                return (
                  <TouchableOpacity key={o.id} style={[styles.pick, on && styles.pickOn]} onPress={() => { setOrder(o); setAmount(o.grand ? String(Math.round(o.grand)) : ''); }}>
                    <Text style={[styles.pickTxt, on && styles.pickTxtOn]} numberOfLines={1}>{o.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>MODE</Text>
            <View style={styles.wrapRow}>
              {MODES.map((m) => {
                const on = mode === m;
                return (
                  <TouchableOpacity key={m} style={[styles.pick, on && styles.pickOn]} onPress={() => setMode(m)}>
                    <Text style={[styles.pickTxt, on && styles.pickTxtOn]}>{LABEL[m]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>AMOUNT COLLECTED</Text>
            <TextInput
              style={styles.ipt}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
              placeholder="0"
              placeholderTextColor={theme.meta}
              keyboardType="number-pad"
            />

            {mode !== 'cash' && (
              <>
                <Text style={styles.label}>REFERENCE / UTR</Text>
                <TextInput
                  style={styles.ipt}
                  value={utr}
                  onChangeText={setUtr}
                  placeholder="Transaction or cheque number"
                  placeholderTextColor={theme.meta}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </>
            )}

            <TouchableOpacity style={[styles.save, busy && { opacity: 0.55 }]} onPress={save} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Log payment</Text>}
            </TouchableOpacity>
            <Text style={styles.foot}>
              Only confirmed, paid orders count towards your commission — log every collection.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, maxHeight: '88%',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 19, fontWeight: '700', color: theme.ink },
  close: { fontSize: 19, color: theme.meta, paddingHorizontal: 6 },

  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pick: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, maxWidth: 170,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  pickOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  pickTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2 },
  pickTxtOn: { color: '#fff', fontWeight: '700' },

  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: theme.ink,
  },
  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  foot: { fontSize: 12, color: theme.meta, marginTop: 12, textAlign: 'center', lineHeight: 18 },
});
