import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../api';
import { theme } from '../theme';
import { useCandidate } from '../state';
import MiraFab from '../components/MiraFab';

// Same lists the web candidate form offers (docs/lms/lms/lms-data.jsx).
const STATES = [
  'Maharashtra', 'Kerala', 'Karnataka', 'Jharkhand', 'Gujarat', 'Tamil Nadu',
  'Telangana', 'Rajasthan', 'Delhi', 'West Bengal', 'Uttar Pradesh', 'Madhya Pradesh',
];
const EXP = ['0–1 yr', '1–3 yrs', '3–5 yrs', '5+ yrs'];
const SOURCES = ['Google', 'LinkedIn', 'Instagram', 'Referral'];

export default function ApplyScreen({ navigation }: any) {
  const { cand, submitApplication } = useCandidate();
  const [name, setName] = useState(cand.name);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [exp, setExp] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState<{ name: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_MB = 100; // mirrors MAX_DOC_BYTES in src/services/storage.ts
  const MAX_BYTES = MAX_MB * 1024 * 1024;
  const DOC_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  async function pickResume() {
    if (uploading) return;
    try {
      // Deliberately '*/*': filtering the picker by MIME hides real CVs on many
      // Android file providers (Downloads/Drive report generic types), leaving
      // the applicant staring at a picker with nothing selectable. Pick freely,
      // then validate by extension below.
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const f = res.assets?.[0];
      if (!f) return;

      // Checked here as well as on the server: a clear message beats a rejected
      // upload after the whole file has gone over the wire.
      if (f.size && f.size > MAX_BYTES) { Alert.alert(`That file is larger than ${MAX_MB}MB`); return; }

      // The extension is the reliable signal. Android hands back
      // "application/octet-stream" (or nothing) for a perfectly good PDF, and
      // trusting that alone rejected valid CVs before they were ever sent.
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const EXT_MIME: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      const mime = DOC_TYPES.includes(f.mimeType || '') ? (f.mimeType as string) : EXT_MIME[ext];
      if (!mime) { Alert.alert('Upload a PDF or Word document', 'Pick a .pdf, .doc or .docx file.'); return; }

      setUploading(true);
      const saved = await api.uploadResume({ uri: f.uri, name: f.name, mimeType: mime });
      setResume({ name: (saved as any).resumeName || f.name, size: (saved as any).resumeSize ?? f.size });
    } catch (e: any) {
      Alert.alert('Could not attach your CV', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  // Name, email and phone come from the account, so they are shown locked
  // rather than asked for again.
  useEffect(() => {
    let alive = true;
    api.me()
      .then((me) => {
        if (!alive) return;
        if (me.name) setName(me.name);
        if (me.email) setEmail(me.email);
        if (me.phone) setMobile(me.phone);
      })
      .catch(() => {/* the form still works, just unprefilled */});

    // Anything already on file comes back, so re-opening the form shows what
    // was submitted instead of a blank page.
    api.myCandidate()
      .then((c) => {
        if (!alive) return;
        if (c.city) setCity(c.city);
        if (c.state) setState(c.state);
        if (c.exp) setExp(c.exp);
        if (c.source) setSource(c.source);
        const withCv = c as unknown as { resumeName?: string; resumeSize?: number };
        if (withCv.resumeName) setResume({ name: withCv.resumeName, size: withCv.resumeSize });
      })
      .catch(() => {/* first-time applicant */});

    return () => { alive = false; };
  }, []);

  async function submit() {
    if (mobile.replace(/\D/g, '').length < 10) { Alert.alert('Enter a valid mobile number'); return; }
    if (!city.trim() || !state || !exp || !source) {
      Alert.alert('Please fill all required fields');
      return;
    }
    setBusy(true);
    try {
      // Persisted against the candidate's own pipeline row, so the office sees
      // the application rather than it only living in this app's memory.
      await api.apply({ city: city.trim(), state, exp, source });
      submitApplication();
      Alert.alert('Application submitted', 'Our team will review it and call you for a short screening.', [
        { text: 'Back to dashboard', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      {/* .cand-appbar — back button + screen name */}
      <SafeAreaView edges={['top']} style={styles.appbarWrap}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <Feather name="chevron-left" size={20} color={theme.ink} />
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>Apply Now</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.pad}
          keyboardShouldPersistTaps="handled"
          // Swiping the list away is the natural way to get rid of the keyboard
          // on a long form; without this it stays up and hides half the fields.
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text style={styles.title}>Apply — Field Sales Representative</Text>
            <Text style={styles.subtitle}>Eurostar Gemstones · Pan-India Openings</Text>
          </View>

          <Text style={[styles.sec, { marginTop: 0 }]}>Personal Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <LockedField icon="user" value={name || '—'} />

          <Text style={styles.label}>Mobile Number *</Text>
          {mobile ? (
            <LockedField icon="phone" value={mobile} />
          ) : (
            <View style={styles.iptWrap}>
              <Feather name="phone" size={18} color={theme.purple} style={styles.ic} />
              <TextInput
                style={styles.ipt}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter mobile number"
                placeholderTextColor={theme.meta}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          )}

          <Text style={styles.label}>Email Address *</Text>
          {email ? (
            <LockedField icon="mail" value={email} />
          ) : (
            <View style={styles.iptWrap}>
              <Feather name="mail" size={18} color={theme.purple} style={styles.ic} />
              <TextInput
                style={styles.ipt}
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={theme.meta}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          <Text style={styles.label}>City *</Text>
          <View style={styles.iptWrap}>
            <Feather name="map-pin" size={18} color={theme.purple} style={styles.ic} />
            <TextInput
              style={styles.ipt}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Mumbai"
              placeholderTextColor={theme.meta}
            />
          </View>

          <Text style={styles.label}>State *</Text>
          <Select value={state} onChange={setState} options={STATES} placeholder="Select State" title="Select State" />

          <Text style={styles.sec}>Experience &amp; Documents</Text>

          <Text style={styles.label}>Years of Experience *</Text>
          <Select value={exp} onChange={setExp} options={EXP} placeholder="Select" title="Years of Experience" />

          <Text style={styles.label}>Resume / CV *</Text>
          <TouchableOpacity
            style={[styles.upload, resume && styles.uploadDone]}
            activeOpacity={0.7}
            onPress={pickResume}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator color={theme.purple} />
                <Text style={styles.uploadTxt}>Uploading…</Text>
              </>
            ) : resume ? (
              <>
                <Feather name="check-circle" size={24} color={theme.green} />
                <Text style={[styles.uploadTxt, { color: theme.greenInk }]} numberOfLines={1}>{resume.name}</Text>
                <Text style={styles.uploadHint}>
                  {resume.size ? `${Math.max(1, Math.round(resume.size / 1024))} KB · ` : ''}Tap to replace
                </Text>
              </>
            ) : (
              <>
                <Feather name="file-text" size={24} color={theme.purple} />
                <Text style={styles.uploadTxt}>Click to upload or drag &amp; drop</Text>
                <Text style={styles.uploadHint}>PDF or Word · Max {MAX_MB}MB</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>How did you know about this *</Text>
          <Select value={source} onChange={setSource} options={SOURCES} placeholder="Select Source" title="Select Source" />

          <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            <Text style={styles.btnTxt}>Submit Application</Text>
          </TouchableOpacity>

          <Text style={styles.foot}>Your data is confidential and used only for hiring purposes.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <MiraFab who={cand.name || undefined} />
    </View>
  );
}

/** A value the candidate cannot change here — gold border + padlock, as on the web. */
function LockedField({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={[styles.iptWrap, styles.iptLocked]}>
      <Feather name={icon} size={18} color={theme.purple} style={styles.ic} />
      <Text style={[styles.ipt, styles.iptLockedTxt]} numberOfLines={1}>{value}</Text>
      <Feather name="lock" size={15} color={theme.lockGold} />
    </View>
  );
}

/** React Native has no <select>, so the same job is done by a sheet of options. */
function Select({
  value, onChange, options, placeholder, title,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.iptWrap} activeOpacity={0.7} onPress={() => setOpen(true)}>
        <Text style={[styles.ipt, styles.selectTxt, !value && { color: theme.meta }]}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color={theme.ink2} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetWrap}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.close}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={styles.option}
                  onPress={() => { onChange(o); setOpen(false); }}
                >
                  <Text style={[styles.optionTxt, value === o && { color: theme.purpleInk, fontWeight: '700' }]}>{o}</Text>
                  {value === o && <Feather name="check" size={17} color={theme.purpleInk} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Mirrors .cand-appbar / .cand-sec / .cand-label / .cand-ipt in docs/lms/lms/lms.css.
const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  back: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  appbarTitle: { fontSize: 17, fontWeight: '700', color: theme.ink },

  pad: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 96, backgroundColor: theme.surface },

  title: { fontSize: 18, fontWeight: '700', color: theme.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.meta, marginTop: 3, textAlign: 'center' },

  sec: { fontSize: 15, fontWeight: '700', color: theme.ink, marginTop: 22, marginBottom: 12 },
  label: { fontSize: 12.5, fontWeight: '600', color: theme.ink2, marginTop: 14, marginBottom: 6 },

  iptWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, minHeight: 50,
  },
  iptLocked: { borderColor: theme.lockGold, backgroundColor: theme.lockBg },
  iptLockedTxt: { color: theme.ink2 },
  ic: { marginRight: 11 },
  ipt: { flex: 1, fontSize: 14, color: theme.ink, paddingVertical: 14 },
  selectTxt: { paddingVertical: 15 },

  upload: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.purple,
    backgroundColor: theme.purpleSoft, borderRadius: 14,
    paddingVertical: 26, paddingHorizontal: 14, alignItems: 'center',
  },
  uploadDone: { borderStyle: 'solid', borderColor: theme.green, backgroundColor: theme.greenSoft },
  uploadTxt: { fontWeight: '600', color: theme.purpleInk, marginTop: 6, fontSize: 14 },
  uploadHint: { fontSize: 12, color: theme.meta, marginTop: 2 },

  btn: { backgroundColor: theme.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  btnTxt: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  foot: { textAlign: 'center', fontSize: 11.5, color: theme.meta, marginTop: 12 },

  sheetWrap: { flex: 1, backgroundColor: 'rgba(21,19,15,0.4)' },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 20, maxHeight: '62%',
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.ink },
  close: { fontSize: 26, lineHeight: 28, color: theme.meta, paddingHorizontal: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  optionTxt: { flex: 1, fontSize: 14.5, color: theme.ink2 },
});
