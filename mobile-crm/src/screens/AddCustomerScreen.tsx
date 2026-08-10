import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api, type NewCustomer } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TERMS: NewCustomer['terms'][] = ['cash', '15', '30', '45', '60'];

// Add a shop to the book, from the shop floor. Same fields the web CRM's form
// carries, and the same server rules apply: a rep's new account is mapped to
// them automatically, and a GSTIN or mobile that already exists is refused with
// the name of whoever already holds it.
export default function AddCustomerScreen({ navigation }: any) {
  const [f, setF] = useState<NewCustomer>({ name: '', contact: '', phone: '', city: '', gstin: '', shipAddress: '', notes: '', terms: 'cash' });
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);   // preview uri
  const [photoData, setPhotoData] = useState<string | null>(null); // what we send
  const [geo, setGeo] = useState('');
  const set = (k: keyof NewCustomer) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  // Field capture, as on the desktop: photograph the shop and tag where it is,
  // so the office can see the account is a real place a rep stood in front of.
  const shootShop = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera needed', 'Allow the camera to photograph the shop.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    setPhoto(res.assets[0].uri);
    setPhotoData(`data:image/jpeg;base64,${res.assets[0].base64}`);
  };

  const tagGeo = async () => {
    setGeo('Locating…');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) { setGeo(''); Alert.alert('Location needed', 'Allow location to tag the shop.'); return; }
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGeo(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);
    } catch { setGeo(''); Alert.alert('Could not get a location fix', 'Try again in the open.'); }
  };

  const phoneOk = /^[6-9]\d{9}$/.test((f.phone || '').replace(/\D/g, ''));
  const canSave = f.name.trim().length > 1 && phoneOk;

  const save = async () => {
    if (!canSave) {
      Alert.alert('Missing details', 'A company name and a 10-digit mobile number are needed.');
      return;
    }
    setBusy(true);
    try {
      const c = await api.addCustomer({
        ...f,
        name: f.name.trim(),
        phone: (f.phone || '').replace(/\D/g, ''),
        contact: f.contact?.trim() || undefined,
        city: f.city?.trim() || undefined,
        gstin: f.gstin?.trim().toUpperCase() || undefined,
        shipAddress: f.shipAddress?.trim() || undefined,
        notes: f.notes?.trim() || undefined,
        shopPhoto: photoData || undefined,
        geo: geo && !geo.startsWith('Locating') ? geo : undefined,
      });
      Alert.alert('Customer added', `${c.name} is on your book as ${c.code}.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      // The server answers a duplicate with 409 and a sentence naming the
      // existing account — show that sentence rather than a generic failure.
      Alert.alert(e?.status === 409 ? 'Already on the books' : 'Could not add that customer',
        e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead title="Add customer" sub="New account on your book" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Field capture — the shop, and where it is. */}
          <View style={styles.capture}>
            <TouchableOpacity style={styles.photoBox} onPress={shootShop} activeOpacity={0.8}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <Text style={styles.photoHint}>📷 Tap to photograph{'\n'}the customer's shop</Text>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity style={styles.geoBtn} onPress={tagGeo}>
                <Text style={styles.geoTxt}>📍 Tag location</Text>
              </TouchableOpacity>
              {!!geo && <Text style={styles.geoVal}>{geo}</Text>}
              <Text style={styles.captureNote}>
                The photo and location travel with the account so the office can see it is a real shop.
              </Text>
            </View>
          </View>

          <Field label="COMPANY / FIRM NAME" value={f.name} onChange={set('name')} placeholder="Shree Ganesh Jewellers" autoFocus />
          <Field label="CONTACT PERSON" value={f.contact || ''} onChange={set('contact')} placeholder="Who you deal with" />

          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.cc}><Text style={styles.ccTxt}>+91</Text></View>
            <TextInput
              style={[styles.ipt, { flex: 1 }]}
              value={f.phone}
              onChangeText={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="9820000000"
              placeholderTextColor={theme.meta}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          {!!f.phone && !phoneOk && <Text style={styles.warn}>That is not a 10-digit Indian mobile number.</Text>}

          <Field label="CITY" value={f.city || ''} onChange={set('city')} placeholder="Mumbai" />
          <Field label="PINCODE" value={f.pincode || ''} onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} placeholder="400001" />
          <Field label="GSTIN" value={f.gstin || ''} onChange={set('gstin')} placeholder="27AAAAA0000A1Z5" autoCapitalize="characters" />
          <Field label="SHOP / DELIVERY ADDRESS" value={f.shipAddress || ''} onChange={set('shipAddress')} placeholder="Street, area, landmark" multiline />
          <Field label="SPECIAL NOTES" value={f.notes || ''} onChange={set('notes')} placeholder="Anything the office should know" multiline />

          <Text style={styles.label}>PAYMENT TERMS</Text>
          <View style={styles.terms}>
            {TERMS.map((t) => {
              const on = f.terms === t;
              return (
                <TouchableOpacity key={t} style={[styles.term, on && styles.termOn]} onPress={() => setF((s) => ({ ...s, terms: t }))}>
                  <Text style={[styles.termTxt, on && styles.termTxtOn]}>{t === 'cash' ? 'Cash' : `${t} days`}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.save, (!canSave || busy) && { opacity: 0.55 }]} onPress={save} disabled={!canSave || busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Add customer</Text>}
          </TouchableOpacity>
          <Text style={styles.foot}>
            The same shop cannot be added twice — the office keys the master on GSTIN and mobile number.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline, autoCapitalize, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; autoCapitalize?: any; autoFocus?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.ipt, multiline && { height: 76, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.meta}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 70, width: '100%', maxWidth: 620, alignSelf: 'center' },

  capture: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  photoBox: {
    width: 130, height: 130, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: theme.border, backgroundColor: theme.card,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { fontSize: 12, color: theme.meta, textAlign: 'center', paddingHorizontal: 8, lineHeight: 17 },
  geoBtn: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
    borderRadius: 9, paddingVertical: 10, alignItems: 'center',
  },
  geoTxt: { fontSize: 12.5, fontWeight: '700', color: theme.ink2 },
  geoVal: { fontSize: 11.5, color: theme.meta, fontFamily: 'monospace', textAlign: 'center' },
  captureNote: { fontSize: 11.5, color: theme.meta, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: '700', color: theme.gold, letterSpacing: 0.8, marginTop: 18, marginBottom: 7 },
  ipt: {
    backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: theme.ink,
  },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  cc: {
    justifyContent: 'center', paddingHorizontal: 14, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10,
  },
  ccTxt: { fontSize: 15, fontWeight: '600', color: theme.ink2 },
  warn: { fontSize: 12, color: theme.ruby, marginTop: 6 },

  terms: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  term: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  termOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  termTxt: { fontSize: 12.5, fontWeight: '600', color: theme.ink2 },
  termTxtOn: { color: '#fff', fontWeight: '700' },

  save: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  foot: { fontSize: 12, color: theme.meta, marginTop: 14, lineHeight: 18, textAlign: 'center' },
});
