import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { api, TestConfig } from '../api';
import { theme } from '../theme';
import { useCandidate } from '../state';

type Q = { id: string; type: string; prompt: string; options: string[] };

// The app bar lives out here on purpose. It used to be declared inside the
// screen, which makes it a brand-new component type on every render — and the
// countdown re-renders the screen once a second, so React threw the whole
// header away and built it again every tick. The safe-area inset was
// re-measured each time, which is the flicker and the jump down the page that
// made the test feel broken while the clock ran.
function Appbar({
  onBack,
  sub,
  right,
}: {
  onBack: () => void;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.appbarWrap}>
      <View style={styles.appbar}>
        <TouchableOpacity style={styles.back} onPress={onBack} accessibilityLabel="Back">
          <Feather name="chevron-left" size={20} color={theme.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Take Test</Text>
          {sub}
        </View>
        {right}
      </View>
    </SafeAreaView>
  );
}

// The assessment is now LIVE: the paper comes from the office's question bank
// (GET /questions/paper) WITHOUT the answer key, and the server marks it
// (POST /questions/score). This replaces the old hard-coded 5-question quiz that
// scored itself in the app — that never reflected the real bank or pass mark.
export default function TestScreen({ navigation }: any) {
  const { cand, setScore } = useCandidate();

  const [paper, setPaper] = useState<Q[] | null>(null); // null = loading
  const [cfg, setCfg] = useState<TestConfig | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [secs, setSecs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [starting, setStarting] = useState(false);
  const submittedRef = useRef(false);

  // What the server says about this candidate's sitting — asked first, because
  // the answer decides whether this is a fresh paper, the same one they are
  // part-way through on another phone, or an attempt already used up. The test
  // used to be entirely a property of the handset, so a candidate signing in on
  // a second device found no progress and no way to continue.
  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const { run } = await api.testRun().catch(() => ({ run: null }));
        const live = run && !run.submittedAt && !run.expired;
        // Ask for the exact questions of the sitting in progress; otherwise a
        // randomised bank would deal a different paper on this device.
        const res = await api.testPaper(live ? run!.qIds : undefined);
        if (stale) return;
        setPaper(res.questions || []);
        setCfg(res.config);
        if (live) {
          setAns(run!.answers || {});
          setI(Math.min(run!.index || 0, Math.max(0, (res.questions?.length || 1) - 1)));
          armClock(run!.secondsLeft);
          setStarted(true); // straight back into the paper, where they left it
        } else if (run && !run.submittedAt && run.expired) {
          // The clock ran out while the app was closed or in the background.
          // Finish it now against the answers saved during the sitting.
          setAns(run.answers || {});
          submit(true);
        } else {
          setSecs((res.config?.durationMin || 15) * 60);
          // Finished — either submitted on this device or on the other one.
          if (run?.submittedAt || cand.testConsumed) setAlreadyTaken(true);
        }
      } catch {
        if (!stale) setLoadErr('Could not load the test. Check your connection and try again.');
      }
    })();
    return () => { stale = true; };
  }, [cand.testConsumed]);

  // Training-completion gate — mirrors the web: every module that actually has
  // content must be watched before the test can start.
  const watched = cand.watched || [];
  const [modIds, setModIds] = useState<string[] | null>(null);
  useEffect(() => {
    api.modules()
      .then((list) => setModIds((list || []).filter((m) => m.summary || m.videoUrl).map((m) => m.id)))
      .catch(() => setModIds([]));
  }, []);
  const trainingDone = modIds !== null && modIds.length > 0 && modIds.every((id) => watched.includes(id));

  const qs = paper || [];
  const q = qs[i];
  const last = i === qs.length - 1;
  // Each answer goes to the server as it is chosen, so the other device shows
  // the same paper at the same place. Best-effort: the sitting carries on
  // locally if the write fails, and the next save catches it up.
  const pick = (oi: number) => {
    if (!q) return;
    setAns((a) => ({ ...a, [q.id]: oi }));
    api.saveTestRun({ [q.id]: oi }, i).catch(() => {});
  };

  // Begin the sitting — or join the one already open on another device, which
  // is what the server hands back. Either way the clock comes from the server,
  // measured from when the attempt actually started, so switching phones cannot
  // buy more time.
  const beginTest = async () => {
    setStarting(true);
    try {
      const { run } = await api.startTestRun(qs.map((x) => x.id), cfg?.durationMin || 15);
      if (run.qIds.join(',') !== qs.map((x) => x.id).join(',')) {
        // Joined a sitting begun elsewhere — load that paper, not this one.
        const res = await api.testPaper(run.qIds);
        setPaper(res.questions || []);
      }
      setAns(run.answers || {});
      setI(run.index || 0);
      armClock(run.secondsLeft);
      setStarted(true);
    } catch (e: any) {
      // 409 = the one attempt is gone. Say so plainly instead of a dead button.
      if (e?.status === 409) setAlreadyTaken(true);
      else Alert.alert('Could not start the test', e?.message || 'Check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  // Ending the test is the server's job now: it holds the deadline and the
  // answers, marks the paper against the whole question set, and records the
  // attempt. `timedOut` distinguishes "you ran out of time" from "you pressed
  // Submit", so the candidate is told which happened.
  const submit = useCallback(
    async (timedOut = false) => {
      // Guarded: the clock hitting zero and a tap on Submit can both fire.
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await api.submitTestRun(ans);
        setScore(res.score, res.passed, res.passPct);
        if (timedOut || res.expired) {
          Alert.alert('Time is up', 'Your test was submitted automatically with the answers you had given.');
        }
        navigation.replace('Result');
      } catch (e: any) {
        // The attempt was already closed (the other device, or an earlier
        // auto-submit) — show the result rather than an error.
        if (e?.status === 409) { navigation.replace('Result'); return; }
        submittedRef.current = false;
        setSubmitting(false);
        Alert.alert('Could not submit', 'Check your connection and try again.');
      }
    },
    [ans, setScore, navigation]
  );

  // The clock counts down to a fixed moment, not by subtracting a second per
  // tick. A ticking counter stops with the JS thread the instant the app is
  // backgrounded or the screen sleeps, so it resumed from where it paused and
  // handed out unlimited extra time. `endsAt` is set from the server's own
  // seconds-left, and every tick just asks how long is left until then.
  const endsAtRef = useRef<number | null>(null);
  const armClock = useCallback((secondsLeft: number) => {
    endsAtRef.current = Date.now() + Math.max(0, secondsLeft) * 1000;
    setSecs(Math.max(0, secondsLeft));
  }, []);

  useEffect(() => {
    if (!started || submittedRef.current) return;
    const tick = () => {
      const left = endsAtRef.current ? Math.round((endsAtRef.current - Date.now()) / 1000) : 0;
      setSecs(Math.max(0, left));
      if (left <= 0) submit(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [started, submit]);

  // Stepping off the test screen holds the countdown; coming back picks it up
  // from the same remaining time. The server keeps the tally, so the pause
  // survives a crash or a restart and cannot be faked by the app.
  useFocusEffect(
    useCallback(() => {
      if (!started || submittedRef.current) return;
      let dropped = false;
      api.resumeTestRun()
        .then(({ run }) => {
          if (dropped || submittedRef.current) return;
          if (run.expired) submit(true);
          else armClock(run.secondsLeft);
        })
        .catch(() => {});
      return () => {
        dropped = true;
        // Leaving the page (Back, or on to another screen) stops the clock.
        if (!submittedRef.current) api.pauseTestRun().catch(() => {});
      };
    }, [started, submit, armClock])
  );

  // Coming back from the background is the moment to re-check with the server:
  // the phone may have slept for an hour, or the clock may have been changed.
  // Whatever the app was showing, the server's deadline is the real one.
  useEffect(() => {
    if (!started) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || submittedRef.current) return;
      api.testRun()
        .then(({ run }) => {
          if (!run || submittedRef.current) return;
          if (run.submittedAt) { navigation.replace('Result'); return; }
          if (run.expired) { submit(true); return; }
          armClock(run.secondsLeft);
        })
        .catch(() => {
          // Offline: fall back on the deadline we already hold, which keeps
          // running in real time either way.
          if (endsAtRef.current && Date.now() >= endsAtRef.current) submit(true);
        });
    });
    return () => sub.remove();
  }, [started, submit, armClock, navigation]);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  // Loading (paper or the training list not back yet).
  if (paper === null || modIds === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <Appbar onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          {loadErr ? <Text style={styles.centerTxt}>{loadErr}</Text> : <ActivityIndicator color={theme.purple} size="large" />}
        </View>
      </View>
    );
  }

  // No questions published yet.
  if (qs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <Appbar onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 34 }}>📝</Text>
          <Text style={[styles.centerTxt, { marginTop: 12 }]}>No assessment has been published yet. Please check back once the office has set it up.</Text>
          <TouchableOpacity style={[styles.cta, { marginTop: 18, alignSelf: 'stretch' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaTxt}>Back to dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // The attempt has been used — here or on another device. Saying so beats a
  // Start button that does nothing, which is what a candidate used to meet.
  if (alreadyTaken && !started) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <Appbar onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={[styles.centerTxt, { marginTop: 12 }]}>
            You have already taken the assessment{cand.score != null ? ` — you scored ${cand.score}%` : ''}.
            {'\n\n'}It is one attempt only. The office can grant a re-test if you need another go.
          </Text>
          {cand.score != null && (
            <TouchableOpacity style={[styles.cta, { marginTop: 18, alignSelf: 'stretch' }]} onPress={() => navigation.replace('Result')}>
              <Text style={styles.ctaTxt}>View my result</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.cta, styles.ctaGhost, { alignSelf: 'stretch' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaGhostTxt}>Back to dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Start gate — one-shot warning before the test begins.
  if (!started) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <Appbar onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.gatePad} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginTop: 8 }}>⚠️</Text>
          <Text style={styles.gateTitle}>One attempt — finish in one sitting</Text>
          <View style={styles.gateList}>
            <Text style={styles.gateLi}>• {qs.length} questions{cfg?.randomize ? ' (random order)' : ''} · pass mark <Text style={styles.b}>{cfg?.passPct ?? 70}%</Text></Text>
            <Text style={styles.gateLi}>• Time limit: <Text style={styles.b}>{cfg?.durationMin ?? 15} minutes</Text> — the test auto-submits when time runs out.</Text>
            <Text style={styles.gateLi}>• Once you tap <Text style={styles.b}>Start</Text>, finish in a <Text style={styles.b}>single sitting</Text>. Leaving uses up your attempt.</Text>
            <Text style={styles.gateLi}>• You can only retake it if the office grants a <Text style={styles.b}>re-test</Text>.</Text>
            <Text style={styles.gateLi}>• Signed in on another phone? The same paper and the same answers follow you — the clock keeps running either way.</Text>
          </View>

          {!trainingDone && (
            <View style={styles.warn}>
              <Text style={styles.warnTxt}>Please finish all training videos before starting the test.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.cta, styles.ctaGreen, (!trainingDone || starting) && { opacity: 0.5 }]}
            disabled={!trainingDone || starting}
            onPress={beginTest}
          >
            <Text style={styles.ctaTxt}>{starting ? 'Starting…' : 'I understand — Start Test'}</Text>
          </TouchableOpacity>
          {!trainingDone && (
            <TouchableOpacity style={[styles.cta, styles.ctaGhost]} onPress={() => navigation.navigate('Training')}>
              <Text style={styles.ctaGhostTxt}>Go to training</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.cta, styles.ctaGhost]} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaGhostTxt}>Not now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Running — one question at a time, timer in the app bar.
  const lowTime = secs <= 30;
  const opts = q.type === 'True-False' ? ['True', 'False'] : q.options;
  const chosen = ans[q.id];
  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <Appbar
        onBack={() => navigation.goBack()}
        sub={<Text style={styles.sub}>Question {i + 1} of {qs.length} · ⚠️ one attempt</Text>}
        right={
          <View style={[styles.timer, { backgroundColor: lowTime ? '#F6E7E7' : theme.purpleSoft }]}>
            <Text style={[styles.timerTxt, { color: lowTime ? '#B91C1C' : theme.purpleInk }]}>⏱ {mmss}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.qPad} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${((i + 1) / qs.length) * 100}%` }]} />
        </View>

        <View style={styles.qtypeRow}>
          <View style={[styles.qtag, q.type === 'MCQ' ? styles.qtagMcq : styles.qtagTf]}>
            <Text style={[styles.qtagTxt, { color: q.type === 'MCQ' ? theme.purpleInk : theme.greenInk }]}>{q.type}</Text>
          </View>
        </View>
        <Text style={styles.prompt}>{q.prompt}</Text>

        {opts.map((o, oi) => {
          const on = chosen === oi;
          return (
            <TouchableOpacity key={oi} style={[styles.opt, on && styles.optOn]} onPress={() => pick(oi)}>
              <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
              <Text style={[styles.optTxt, on && styles.optTxtOn]}>{o}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ marginTop: 18 }}>
          {last ? (
            <TouchableOpacity
              style={[styles.cta, styles.ctaGreen, (chosen === undefined || submitting) && { opacity: 0.5 }]}
              disabled={chosen === undefined || submitting}
              onPress={() => submit(false)}
            >
              <Text style={styles.ctaTxt}>{submitting ? 'Submitting…' : 'Submit Test'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cta, chosen === undefined && { opacity: 0.5 }]}
              disabled={chosen === undefined}
              onPress={() => { setI(i + 1); api.saveTestRun({}, i + 1).catch(() => {}); }}
            >
              <Text style={styles.ctaTxt}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbarWrap: { backgroundColor: theme.surface },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.divider },
  back: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, flexShrink: 0 },
  title: { fontSize: 17, fontWeight: '700', color: theme.ink },
  sub: { fontSize: 12, color: theme.meta, marginTop: 1 },
  timer: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexShrink: 0 },
  timerTxt: { fontFamily: 'monospace', fontWeight: '700', fontSize: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  centerTxt: { fontSize: 14, color: theme.meta, textAlign: 'center', lineHeight: 21 },

  gatePad: { padding: 22, paddingBottom: 48, width: '100%', maxWidth: 620, alignSelf: 'center' },
  qPad: { padding: 18, paddingBottom: 48, width: '100%', maxWidth: 620, alignSelf: 'center' },
  gateTitle: { fontSize: 19, fontWeight: '800', color: theme.ink, textAlign: 'center', marginTop: 8 },
  gateList: { marginTop: 16, gap: 10 },
  gateLi: { fontSize: 13.5, color: theme.ink2, lineHeight: 20 },
  b: { fontWeight: '800', color: theme.ink },
  warn: { backgroundColor: '#F6E7E7', borderWidth: 1, borderColor: '#E6C9C9', borderRadius: 12, padding: 12, marginTop: 16 },
  warnTxt: { fontSize: 13, color: '#9A3B3B' },

  progress: { height: 6, backgroundColor: '#EEEBE3', borderRadius: 6, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: theme.purple, borderRadius: 6 },

  qtypeRow: { flexDirection: 'row', marginBottom: 12 },
  qtag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  qtagMcq: { backgroundColor: theme.purpleSoft },
  qtagTf: { backgroundColor: theme.greenSoft },
  qtagTxt: { fontSize: 11.5, fontWeight: '700' },
  prompt: { fontSize: 18, fontWeight: '600', lineHeight: 25, color: theme.ink, marginBottom: 20 },

  opt: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md, padding: 13, marginBottom: 9 },
  optOn: { borderColor: theme.purple, backgroundColor: theme.purpleSoft },
  optTxt: { fontSize: 14.5, color: theme.ink2, flex: 1 },
  optTxtOn: { color: theme.purpleInk, fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: theme.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.purple },

  cta: { backgroundColor: theme.purple, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  ctaGreen: { backgroundColor: theme.green },
  ctaGhost: { backgroundColor: '#ECEAE3' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
  ctaGhostTxt: { color: theme.ink, fontWeight: '700', fontSize: 15 },
});
