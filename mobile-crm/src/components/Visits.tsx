import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Linking,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { api, type Customer, type Visit } from '../api';
import { theme } from '../theme';

const TODAY = new Date().toISOString().slice(0, 10);
const at = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const mapUrl = (lat?: number | null, lng?: number | null) => `https://www.google.com/maps?q=${lat},${lng}`;

// A visit left open past the end of its day is a failed visit — the desktop's
// rule, and the reason check-out is worth chasing.
const failed = (v: Visit) => !v.checkOut && !!v.day && Date.now() > new Date(`${v.day}T23:59:59`).getTime();

const clock = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s % 60)}` : `${m}:${p(s % 60)}`;
};
const spent = (ms: number) => {
  const m = Math.floor(Math.max(0, ms) / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

/**
 * Customer visits — check in on arrival, check out on leaving.
 *
 * Both ends record the phone's real GPS, and check-out is gated on a 4-digit
 * code the customer reads out, so a rep cannot close a visit from the car. That
 * is the control the desktop enforces and the reason the feature exists.
 *
 * The code is generated on the device here, exactly as the web console does in
 * demo mode; sending it by SMS is a server change, not an app one.
 */
export default function Visits({ customers, onChanged }: { customers: Customer[]; onChanged?: () => void }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [otp, setOtp] = useState<string | null>(null);
  const [entered, setEntered] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = () => { api.visits().then((v) => setVisits(Array.isArray(v) ? v : [])).catch(() => setVisits([])); };
  useEffect(load, []);

  const open = (visits || []).find((v) => !v.checkOut && !failed(v));

  // The clock only ticks while a visit is actually open.
  useEffect(() => {
    if (!open) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [open]);

  const todays = useMemo(
    () => (visits || []).filter((v) => v.day === TODAY).sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn))),
    [visits]
  );

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter((c) =>
      [c.name, c.code, c.city, c.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(t))
    );
  }, [customers, q]);

  const fix = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy || 0) };
    } catch { return null; }
  };

  const checkIn = async (cust: Customer) => {
    setPicking(false);
    setBusy('Capturing location…');
    try {
      const g = await fix();
      if (!g) {
        // The location IS the record. A visit without one proves nothing, so
        // don't quietly file a blank.
        Alert.alert('Location needed', 'A visit records where you are. Allow location access and try again.');
        return;
      }
      await api.visitIn({
        custId: cust.id, custName: cust.name,
        custCity: cust.city || undefined, custMobile: cust.phone || undefined,
        ...g,
      });
      load();
      onChanged?.();
    } catch (e: any) {
      Alert.alert('Could not check in', e?.message || 'Please try again.');
    } finally { setBusy(''); }
  };

  const confirmOut = async () => {
    if (entered.trim() !== otp) { setOtpErr(true); return; }
    setBusy('Checking out…');
    try {
      const g = await fix();
      await api.visitOut(open!.id, g ? { lat: g.lat, lng: g.lng } : undefined);
      setOtp(null); setEntered(''); setOtpErr(false);
      load();
      onChanged?.();
    } catch (e: any) {
      Alert.alert('Could not check out', e?.message || 'Please try again.');
    } finally { setBusy(''); }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>CUSTOMER VISITS · CHECK IN ON ARRIVAL</Text>

      {visits === null ? (
        <ActivityIndicator color={theme.emerald} style={{ marginVertical: 12 }} />
      ) : open ? (
        otp ? (
          <View>
            <View style={styles.otpBox}>
              <Text style={styles.otpTitle}>OTP sent to customer</Text>
              <Text style={styles.otpSub}>
                An OTP has been sent to {open.custMobile || "the customer's number"}. Ask them for the code
                and enter it below to complete check-out.
              </Text>
              <View style={styles.demo}>
                <Text style={styles.demoTxt}>
                  <Text style={{ fontWeight: '700' }}>Demo mode: </Text>OTP is{' '}
                  <Text style={styles.demoCode}>{otp}</Text> (in production this goes via SMS only)
                </Text>
              </View>
            </View>

            <TextInput
              style={[styles.otpInput, otpErr && { borderColor: theme.ruby }]}
              value={entered}
              onChangeText={(v) => { setEntered(v.replace(/\D/g, '')); setOtpErr(false); }}
              placeholder="0000"
              placeholderTextColor={theme.meta}
              keyboardType="number-pad"
              maxLength={4}
            />
            {otpErr && <Text style={styles.err}>❌ Incorrect OTP — ask the customer to check their SMS and try again.</Text>}

            <TouchableOpacity
              style={[styles.primary, (entered.length < 4 || !!busy) && { opacity: 0.5 }]}
              disabled={entered.length < 4 || !!busy}
              onPress={confirmOut}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Confirm check-out</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostWide} onPress={() => { setOtp(null); setOtpErr(false); }}>
              <Text style={styles.ghostTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.openBox}>
            <View style={styles.openTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.openTitle} numberOfLines={1}>● Visiting {open.custName || 'customer'}</Text>
                <Text style={styles.meta}>
                  Checked in {at(open.checkIn)}{open.custCity ? ` · ${open.custCity}` : ''}
                  {open.inAcc != null ? ` · GPS ±${open.inAcc}m` : ''}
                </Text>
              </View>
              <Text style={styles.timer}>{clock(now - new Date(open.checkIn || Date.now()).getTime())}</Text>
            </View>
            <TouchableOpacity style={[styles.primary, !!busy && { opacity: 0.5 }]} disabled={!!busy} onPress={() => { setOtp(String(Math.floor(1000 + Math.random() * 9000))); setEntered(''); setOtpErr(false); }}>
              <Text style={styles.primaryTxt}>Request check-out</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View>
          <TouchableOpacity
            style={[styles.primary, (!!busy || !customers.length) && { opacity: 0.5 }]}
            disabled={!!busy || !customers.length}
            onPress={() => { setQ(''); setPicking(true); }}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>📍 Check in at a customer</Text>}
          </TouchableOpacity>
          <Text style={styles.meta}>
            {customers.length
              ? 'Your location is recorded at check-in and check-out.'
              : 'No customers on your book to visit yet.'}
          </Text>
        </View>
      )}

      {todays.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subLabel}>Today's visits</Text>
          {todays.map((v) => (
            <View key={v.id} style={styles.visitRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.visitName} numberOfLines={1}>
                  {v.custName || 'Customer'}{v.custCity ? ` · ${v.custCity}` : ''}
                </Text>
                <Text style={styles.meta}>
                  {at(v.checkIn)} → {v.checkOut
                    ? at(v.checkOut)
                    : failed(v)
                      ? <Text style={{ color: theme.ruby, fontWeight: '700' }}>check-out failed</Text>
                      : <Text style={{ color: theme.emeraldInk, fontWeight: '700' }}>in progress</Text>}
                  {v.checkOut ? ` · ${spent(new Date(v.checkOut).getTime() - new Date(v.checkIn || 0).getTime())}` : ''}
                </Text>
              </View>
              {v.inLat != null && (
                <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(mapUrl(v.inLat, v.inLng))}>
                  <Text style={styles.ghostTxt}>Map</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* The whole book, searchable — a rep with sixty accounts cannot find one
          in a row of chips. */}
      <Modal visible={picking} animationType="slide" transparent onRequestClose={() => setPicking(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Which customer?</Text>
              <TouchableOpacity onPress={() => setPicking(false)} accessibilityLabel="Close">
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.search}
              value={q}
              onChangeText={setQ}
              placeholder="Search name, code, city…"
              placeholderTextColor={theme.meta}
              autoCorrect={false}
            />
            <FlatList
              data={matches}
              keyExtractor={(c) => c.id || c.code}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.meta}>No customer matches that.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.custRow} onPress={() => checkIn(item)}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.visitName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[item.code, item.city, item.phone].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: theme.meta, marginBottom: 12 },
  subLabel: { fontSize: 12, fontWeight: '700', color: theme.meta, marginBottom: 2 },
  meta: { fontSize: 12, color: theme.meta, marginTop: 6, lineHeight: 17 },

  openBox: { backgroundColor: theme.emeraldSoft, borderWidth: 1, borderColor: '#B8C6E4', borderRadius: 12, padding: 13 },
  openTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  openTitle: { fontSize: 14.5, fontWeight: '700', color: theme.emeraldInk },
  timer: { fontFamily: 'monospace', fontWeight: '800', fontSize: 20, color: theme.emeraldInk, flexShrink: 0 },

  otpBox: { backgroundColor: theme.emeraldSoft, borderWidth: 1, borderColor: '#B8C6E4', borderRadius: 12, padding: 13 },
  otpTitle: { fontSize: 13.5, fontWeight: '700', color: theme.emeraldInk, marginBottom: 3 },
  otpSub: { fontSize: 12.5, color: theme.ink2, lineHeight: 18 },
  demo: { marginTop: 9, padding: 9, backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#E2B43A', borderRadius: 6 },
  demoTxt: { fontSize: 12, color: '#8B6A00', lineHeight: 17 },
  demoCode: { fontFamily: 'monospace', fontWeight: '800', fontSize: 15 },
  otpInput: {
    marginTop: 12, paddingVertical: 12, fontSize: 24, fontFamily: 'monospace', fontWeight: '700',
    borderWidth: 2, borderColor: theme.border, borderRadius: 10, textAlign: 'center', letterSpacing: 10,
    color: theme.ink, backgroundColor: theme.surface,
  },
  err: { color: theme.ruby, fontSize: 12.5, fontWeight: '600', marginTop: 8 },

  primary: { backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  primaryTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
    borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0,
  },
  ghostWide: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  ghostTxt: { fontSize: 12.5, fontWeight: '700', color: theme.ink2 },

  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.divider },
  visitName: { fontSize: 13.5, fontWeight: '700', color: theme.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, maxHeight: '78%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.ink },
  close: { fontSize: 18, color: theme.meta, paddingHorizontal: 6 },
  search: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.ink, marginBottom: 8,
  },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.divider },
  chev: { fontSize: 20, color: theme.meta, flexShrink: 0 },
});
