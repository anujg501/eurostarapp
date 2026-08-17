import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type Customer } from '../api';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';
import { useT } from '../i18n';

const TABS = ['Business details', 'Addresses', 'Security'] as const;
type Tab = (typeof TABS)[number];

const CREDIT = ['15', '30', '45', '60'];

/**
 * My account — the customer's own record, laid out as the storefront lays it
 * out: the shop header stays, then the page head, then business details,
 * addresses and security across three tabs, and the company footer.
 *
 * Customer code and payment terms are shown but not editable. Those are the
 * office's to set; letting a customer type their own credit terms would be a
 * promise the shop never made.
 */
export default function AccountScreen({ navigation, onSignOut }: any) {
  const T = useT();
  const [tab, setTab] = useState<Tab>('Business details');
  const [cust, setCust] = useState<Customer | null>(null);
  const [f, setF] = useState({ name: '', contact: '', email: '', phone: '', city: '', gstin: '' });
  const [addr, setAddr] = useState({ ship: '', bill: '', same: true });
  const [who, setWho] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.me().catch(() => null);
      if (me) setWho(me.name || '');
      const phone = me?.phone || '';
      // Without a phone there is no master record to find — this account was
      // never added to the customer master.
      const c = phone ? await api.customerByPhone(phone).catch(() => null) : null;
      if (c) {
        setCust(c);
        setF({
          name: c.name || '', contact: c.contact || '', email: c.email || '',
          phone: c.phone || phone, city: c.city || '', gstin: c.gstin || '',
        });
        setAddr({ ship: c.shipAddress || '', bill: c.billAddress || '', same: !c.billAddress });
      } else {
        setF((s) => ({ ...s, name: me?.name || '', phone, email: me?.email || '', gstin: me?.gstin || '' }));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const noRecord = () =>
    setNote({
      ok: false,
      text: 'No server record found for this account yet — ask your rep to add you to the customer master.',
    });

  const saveDetails = async () => {
    if (!f.name.trim()) { setNote({ ok: false, text: 'A firm or company name is needed.' }); return; }
    if (!cust?.id) { noRecord(); return; }
    setBusy(true); setNote(null);
    try {
      const saved = await api.saveCustomer(cust.id, {
        name: f.name.trim(), contact: f.contact, email: f.email,
        phone: f.phone, city: f.city, gstin: f.gstin,
      });
      setCust(saved);
      setNote({ ok: true, text: 'Profile updated successfully.' });
      setTimeout(() => setNote(null), 3000);
    } catch (e: any) {
      setNote({ ok: false, text: e?.message || 'Could not save — please try again.' });
    } finally { setBusy(false); }
  };

  const saveAddresses = async () => {
    if (!addr.same && !addr.bill.trim()) {
      setNote({ ok: false, text: 'Enter a billing address or tick "Same as shipping".' });
      return;
    }
    if (!cust?.id) { noRecord(); return; }
    setBusy(true); setNote(null);
    try {
      const saved = await api.saveCustomer(cust.id, {
        shipAddress: addr.ship,
        billAddress: addr.same ? '' : addr.bill,
      });
      setCust(saved);
      setNote({ ok: true, text: 'Addresses updated.' });
      setTimeout(() => setNote(null), 3000);
    } catch (e: any) {
      setNote({ ok: false, text: e?.message || 'Could not save — please try again.' });
    } finally { setBusy(false); }
  };

  const signOut = () =>
    Alert.alert('Sign out?', 'You will need a one-time code to sign back in.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
    ]);

  const terms = cust?.terms || 'cash';
  const termsLabel = CREDIT.includes(String(terms)) ? `${terms} days credit` : 'Cash';

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Home" who={f.name || who} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.crumb}>{T('my_account', 'My account').toUpperCase()}</Text>
          <Text style={styles.h1}>{f.name || who || 'My account'}</Text>
          <Text style={styles.sub}>
            Account{cust?.code ? ` ${cust.code}` : ''}{f.city ? ` · ${f.city}` : ''}
          </Text>

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={15} color={theme.ink} />
            <Text style={styles.backTxt}>{T('back', 'Back')}</Text>
          </TouchableOpacity>

          {/* Underlined tabs, as .tab-btn.active draws on the web — a 2px ink
              rule under the live one, not a boxed button. */}
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const on = tab === t;
              return (
                <TouchableOpacity key={t} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabTxt, on && styles.tabTxtOn]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!note && (
            <View style={[styles.note, note.ok ? styles.noteOk : styles.noteErr]}>
              <Text style={[styles.noteTxt, { color: note.ok ? theme.emeraldInk : theme.ruby }]}>{note.text}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 30 }} />
          ) : tab === 'Business details' ? (
            <View style={styles.card}>
              <Field label="FIRM / COMPANY" value={f.name} onChange={set('name')} />
              <Field label="CUSTOMER CODE" value={cust?.code || ''} readOnly placeholder="Not assigned yet" />
              <Field label="CONTACT PERSON" value={f.contact} onChange={set('contact')} />
              <Field
                label="MOBILE"
                value={f.phone}
                onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
              />
              <Field label="EMAIL" value={f.email} onChange={set('email')} keyboardType="email-address" autoCapitalize="none" />
              <Field label="CITY" value={f.city} onChange={set('city')} />
              <Field
                label="GST / PAN"
                value={f.gstin}
                onChange={(v) => set('gstin')(v.toUpperCase())}
                placeholder="GSTIN / PAN"
                autoCapitalize="characters"
              />
              <Field label="PAYMENT TERMS" value={termsLabel} readOnly />

              <Text style={styles.hint}>
                Payment terms are set by Eurostar. Contact your rep to request credit terms.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.save, busy && { opacity: 0.55 }]} onPress={saveDetails} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : tab === 'Addresses' ? (
            <View style={styles.card}>
              <Text style={styles.secHead}>Delivery address</Text>
              <Field
                label="SHIPPING ADDRESS"
                value={addr.ship}
                onChange={(v) => setAddr((s) => ({ ...s, ship: v }))}
                multiline
              />

              <Text style={styles.secHead}>Billing address</Text>
              <TouchableOpacity style={styles.checkRow} onPress={() => setAddr((s) => ({ ...s, same: !s.same }))}>
                <View style={[styles.check, addr.same && styles.checkOn]}>
                  {addr.same && <Feather name="check" size={13} color="#fff" />}
                </View>
                <Text style={styles.checkTxt}>Same as shipping address</Text>
              </TouchableOpacity>
              {!addr.same && (
                <Field
                  label="BILLING ADDRESS"
                  value={addr.bill}
                  onChange={(v) => setAddr((s) => ({ ...s, bill: v }))}
                  placeholder="Billing address for invoices"
                  multiline
                />
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.save, busy && { opacity: 0.55 }]} onPress={saveAddresses} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save addresses</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={[styles.secHead, { marginTop: 0 }]}>Sign-in &amp; security</Text>
              <Field label="REGISTERED MOBILE" value={f.phone ? `+91 ${f.phone}` : 'Not on file'} readOnly />
              <Field label="LOGIN METHOD" value="Mobile OTP" readOnly />
              <Text style={styles.hint}>
                Your account is secured using Mobile OTP authentication. Password management is not
                applicable for customer accounts.
              </Text>

              <View style={styles.signOutRule} />
              <TouchableOpacity style={styles.signOut} onPress={signOut}>
                <Text style={styles.signOutTxt}>{T('sign_out', 'Sign out')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <ShopFooter />
        </ScrollView>
      </KeyboardAvoidingView>

      <Mira role="customer" section="My account" />
    </View>
  );
}

function Field({
  label, value, onChange, readOnly, placeholder, multiline, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean;
  placeholder?: string; multiline?: boolean; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.ipt, readOnly && styles.iptRead, multiline && { height: 84, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor={theme.meta}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },

  crumb: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, color: theme.meta },
  // The storefront sets page titles in the serif face.
  h1: { fontFamily: 'serif', fontSize: 30, color: theme.ink, marginTop: 8, letterSpacing: -0.3 },
  sub: { fontSize: 13.5, color: theme.meta, marginTop: 6 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16, paddingVertical: 6 },
  backTxt: { fontSize: 14.5, fontWeight: '600', color: theme.ink },

  tabs: { flexDirection: 'row', gap: 4, marginTop: 18, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.divider },
  tab: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: theme.ink },
  tabTxt: { fontSize: 14, fontWeight: '500', color: theme.meta },
  tabTxtOn: { color: theme.ink, fontWeight: '600' },

  note: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  noteOk: { backgroundColor: theme.emeraldSoft },
  noteErr: { backgroundColor: theme.rubySoft },
  noteTxt: { fontSize: 13.5, fontWeight: '600', lineHeight: 19 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 18 },
  secHead: { fontSize: 16, fontWeight: '700', color: theme.ink, marginTop: 6, marginBottom: 14 },

  label: { fontSize: 11, fontWeight: '700', color: theme.meta, letterSpacing: 0.7, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.ink,
  },
  iptRead: { backgroundColor: theme.paper, color: theme.meta },
  hint: { fontSize: 12.5, color: theme.meta, lineHeight: 18 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  check: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: theme.emerald, borderColor: theme.emerald },
  checkTxt: { fontSize: 14, color: theme.ink },

  // The web right-aligns the save button under the card.
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 13, minWidth: 150, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  signOutRule: { height: 1, backgroundColor: theme.divider, marginTop: 24, marginBottom: 18 },
  signOut: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11,
  },
  signOutTxt: { fontSize: 14, fontWeight: '600', color: theme.ink },
});
