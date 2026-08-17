import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

const WHY: [string, string][] = [
  ['Ready inventory', 'Full access to 20+ calibrated categories, shipped from Mumbai, Jaipur & Hong Kong.'],
  ['Protected territory', 'Exclusive area rights so you grow without internal competition.'],
  ['Training & support', 'Product, grading and sales training via our LMS, plus a dedicated rep.'],
  ['Trade pricing', 'Franchise pricing tiers and credit terms to protect your margins.'],
];

const EXP = ['Yes — established', 'Yes — small/new', 'No — new to trade'];
const FLOORS = ['Ground floor', 'First floor', 'Upper floor', 'Basement'];

type Form = {
  name: string; firm: string; city: string; mobile: string; invest: string;
  exp: string; geo: string; area: string; floor: string; plans: string;
};

/**
 * Join Franchise — the same application the website takes, posting to the same
 * public /franchise endpoint, so an enquiry from the app lands in the CRM's
 * Franchise Requests list beside the ones from the web.
 */
export default function FranchiseScreen({ navigation }: any) {
  const [submitted, setSubmitted] = useState(false);
  const [f, setF] = useState<Form>({
    name: '', firm: '', city: '', mobile: '', invest: '',
    exp: EXP[0], geo: '', area: '', floor: FLOORS[0], plans: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Which dropdown is open — RN has no <select>, so each is a small sheet.
  const [picking, setPicking] = useState<null | 'exp' | 'floor'>(null);

  const set = (k: keyof Form) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    if (busy) return;
    // The website checks these three; the server requires name and mobile.
    if (!f.name.trim() || !f.city.trim() || !f.mobile.trim()) {
      setErr('Name, city and mobile number are required.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      await api.applyFranchise(f);
      setSubmitted(true);
    } catch {
      setErr('Could not submit right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.paper }}>
        <ShopHeader navigation={navigation} current="Join Franchise" />
        <ScrollView contentContainerStyle={styles.pad}>
          <View style={[styles.card, { padding: 34, alignItems: 'center' }]}>
            <View style={styles.tick}>
              <Feather name="check" size={30} color={theme.paper} />
            </View>
            <Text style={styles.thanksH}>Application received</Text>
            <Text style={styles.thanksP}>
              Thank you for your interest in a Eurostar franchise. Our partnerships team will
              review your application and reach out within 3 business days.
            </Text>
            <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.primaryTxt}>Back to home</Text>
            </TouchableOpacity>
          </View>
          <ShopFooter />
        </ScrollView>
        <Mira role="customer" section="Join Franchise" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Join Franchise" />

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PARTNER WITH EUROSTAR</Text>
          <Text style={styles.heroH}>
            Open a <Text style={styles.heroEm}>Eurostar</Text> franchise.
          </Text>
          <Text style={styles.heroP}>
            Bring 40 years of gemstone heritage to your city. Stock moissanite, lab-grown gems,
            cubic zirconia, pearls and more — backed by our supply, pricing and training.
          </Text>
          <View style={styles.heroRule} />
          <View style={styles.stats}>
            <Stat n="40+" label="Years in the trade" />
            <Stat n="20+" label="Product categories" />
            <Stat n="3" label="Distribution hubs" />
          </View>
        </View>

        {/* Why */}
        {WHY.map(([t, d]) => (
          <View key={t} style={styles.card}>
            <Text style={styles.whyH}>{t}</Text>
            <Text style={styles.whyP}>{d}</Text>
          </View>
        ))}

        {/* Form */}
        <View style={[styles.card, { padding: 20, marginTop: 14 }]}>
          <Text style={styles.formH}>Franchise enquiry</Text>
          <Text style={styles.formP}>Tell us about yourself and we'll get in touch.</Text>

          <F label="Your name" req value={f.name} onChange={set('name')} placeholder="Full name" />
          <F label="Firm / company" req value={f.firm} onChange={set('firm')} placeholder="Business name (if any)" />
          <F label="City" req value={f.city} onChange={set('city')} placeholder="Proposed city / area" />
          <F label="Mobile number" req value={f.mobile} onChange={set('mobile')} placeholder="+91 …" keyboardType="phone-pad" />
          <F label="Investment capacity" value={f.invest} onChange={set('invest')} placeholder="e.g. ₹10–25 lakh" />

          <Picker label="Existing jewellery trade?" value={f.exp} onPress={() => setPicking('exp')} />

          <F label="Geolocation of proposed store" value={f.geo} onChange={set('geo')} placeholder="Map link / area landmark" />
          <F label="Area of proposed store" value={f.area} onChange={set('area')} placeholder="Sq. ft (minimum 100 sq feet)" />

          <Picker label="Which floor?" value={f.floor} onPress={() => setPicking('floor')} />

          <View style={styles.note}>
            <Text style={styles.noteTxt}>
              Most preferred: a store in the jewellery market on the ground floor, minimum 100 sq feet.
            </Text>
          </View>

          <F
            label="Tell us about your plans" value={f.plans} onChange={set('plans')}
            placeholder="Retail space, target market, timeline…" multiline
          />

          {!!err && <Text style={styles.err}>{err}</Text>}

          <Text style={styles.reqNote}>
            <Text style={{ color: theme.ruby }}>*</Text> required fields
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primary, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
              <Text style={styles.primaryTxt}>{busy ? 'Submitting…' : 'Submit application'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ShopFooter />
      </ScrollView>

      {/* The two dropdowns, as a sheet each. */}
      <Modal visible={!!picking} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPicking(null)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <Text style={styles.sheetH}>
              {picking === 'exp' ? 'EXISTING JEWELLERY TRADE?' : 'WHICH FLOOR?'}
            </Text>
            {(picking === 'exp' ? EXP : FLOORS).map((o) => {
              const on = picking === 'exp' ? f.exp === o : f.floor === o;
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.sheetRow, on && styles.sheetRowOn]}
                  onPress={() => {
                    setF((x) => ({ ...x, [picking === 'exp' ? 'exp' : 'floor']: o }));
                    setPicking(null);
                  }}
                >
                  <Text style={styles.sheetTxt}>{o}</Text>
                  <View style={{ flex: 1 }} />
                  {on && <Feather name="check" size={15} color={theme.emeraldInk} />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Mira role="customer" section="Join Franchise" />
    </View>
  );
}

const Stat = ({ n, label }: { n: string; label: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statN}>{n}</Text>
    <Text style={styles.statL}>{label}</Text>
  </View>
);

function F({
  label, req, value, onChange, placeholder, multiline, keyboardType,
}: {
  label: string; req?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>
        {label.toUpperCase()}{req && <Text style={{ color: theme.ruby }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.meta}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'sentences'}
      />
    </View>
  );
}

/** A read-only field that opens its options sheet — the web's <select>. */
function Picker({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <TouchableOpacity style={[styles.input, styles.select]} onPress={onPress}>
        <Text style={styles.selectTxt}>{value}</Text>
        <Feather name="chevron-down" size={16} color={theme.meta} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },

  hero: {
    backgroundColor: theme.emerald, borderRadius: theme.radius.lg,
    padding: 24, marginBottom: 16,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: theme.gold },
  heroH: { fontFamily: 'serif', fontSize: 33, color: theme.onDark, marginTop: 14, lineHeight: 40 },
  heroEm: { fontStyle: 'italic', color: '#fff' },
  heroP: { fontSize: 14.5, color: theme.onDarkMeta, marginTop: 14, lineHeight: 22 },
  heroRule: { height: 1, backgroundColor: 'rgba(239,233,220,0.18)', marginTop: 22, marginBottom: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  stat: { width: '50%' },
  statN: { fontFamily: 'serif', fontSize: 26, color: theme.onDark },
  statL: { fontSize: 12, color: theme.onDarkMeta, marginTop: 2 },

  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  whyH: { fontFamily: 'serif', fontSize: 18, color: theme.ink },
  whyP: { fontSize: 13, color: theme.meta, marginTop: 6, lineHeight: 20 },

  formH: { fontFamily: 'serif', fontSize: 24, color: theme.ink },
  formP: { fontSize: 13.5, color: theme.meta, marginTop: 4, marginBottom: 20 },

  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta, marginBottom: 6 },
  input: {
    backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: theme.ink,
  },
  textarea: { height: 92, textAlignVertical: 'top' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectTxt: { fontSize: 14, color: theme.ink },

  note: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderRadius: 10, padding: 12, marginBottom: 14, marginTop: -2,
  },
  noteTxt: { fontSize: 12.5, color: theme.meta, lineHeight: 19 },

  err: { color: theme.ruby, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  reqNote: { fontSize: 12, color: theme.meta, marginTop: 4 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primary: {
    flex: 1, backgroundColor: theme.emerald, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  secondary: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center',
  },
  secondaryTxt: { color: theme.ink, fontSize: 14.5, fontWeight: '700' },

  tick: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  thanksH: { fontFamily: 'serif', fontSize: 28, color: theme.ink, textAlign: 'center' },
  thanksP: { fontSize: 14, color: theme.meta, textAlign: 'center', marginTop: 10, lineHeight: 21, marginBottom: 22 },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingVertical: 10, paddingBottom: 26,
  },
  sheetH: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sheetRowOn: { backgroundColor: theme.emeraldSoft },
  sheetTxt: { fontSize: 15, color: theme.ink },
});
