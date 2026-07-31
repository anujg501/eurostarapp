import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, ResizeMode, Video } from 'expo-av';
import { theme } from '../theme';
import { useCandidate } from '../state';

const HIDE_AFTER_MS = 3500;
const SKIP_MS = 10000;

function fmt(ms?: number) {
  if (!ms || ms < 0 || !isFinite(ms)) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

// Full-screen in-app player with its own controls. Android's stock video
// controls give play/seek/fullscreen and nothing else — no volume, no skip, no
// title, and they sit awkwardly over the app bar. This is the familiar layout
// people expect from a video app: tap to reveal, auto-hide while playing.
export default function VideoPlayerScreen({ route, navigation }: any) {
  const { url, title, videoId } = route.params as { url: string; title?: string; videoId?: string };
  const { markWatched } = useCandidate();
  const video = useRef<Video>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fill, setFill] = useState(false); // zoom-to-fill, like YouTube's pinch
  const [scrubbing, setScrubbing] = useState(false);

  const barRef = useRef<View>(null);
  const barX = useRef(0);
  const barW = useRef(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);

  // Claim the media audio stream, so the phone's volume rocker adjusts THIS
  // playback. Without an explicit audio mode Android may route the keys to the
  // ringtone stream instead, which feels like the volume buttons do nothing.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    }).catch(() => {});
  }, []);

  const armHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), HIDE_AFTER_MS);
  }, []);

  // Controls stay put while paused or scrubbing — hiding them mid-drag or on a
  // paused frame is the kind of thing that makes a player feel broken.
  useEffect(() => {
    if (showUI && playing && !scrubbing) armHide();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showUI, playing, scrubbing, armHide]);

  const onStatus = (s: AVPlaybackStatus) => {
    if (!s.isLoaded) return;
    if (!scrubbing) setPos(s.positionMillis ?? 0);
    setDur(s.durationMillis ?? 0);
    setPlaying(s.isPlaying);
    setBuffering(s.isBuffering ?? false);
    if (s.didJustFinish && !finished.current) {
      finished.current = true;
      // Watching it through is the honest signal that the module is done, so
      // tick it off without making the candidate hunt for "Mark watched".
      if (videoId) markWatched(videoId);
      setShowUI(true);
    }
  };

  const togglePlay = async () => {
    const v = video.current;
    if (!v) return;
    if (playing) await v.pauseAsync();
    else {
      if (finished.current) { finished.current = false; await v.setPositionAsync(0); }
      await v.playAsync();
    }
    setShowUI(true);
  };

  const seekTo = async (ms: number) => {
    const v = video.current;
    if (!v || !dur) return;
    const clamped = Math.max(0, Math.min(dur, ms));
    setPos(clamped);
    await v.setPositionAsync(clamped);
  };

  const skip = (delta: number) => { void seekTo(pos + delta); setShowUI(true); };

  const posFromX = (pageX: number) => {
    const rel = (pageX - barX.current) / Math.max(1, barW.current);
    return Math.max(0, Math.min(1, rel)) * dur;
  };

  const pct = dur > 0 ? Math.min(1, pos / dur) : 0;

  return (
    <View style={styles.root}>
      {/* Tapping the video toggles the controls — the standard gesture. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowUI((s) => !s)}>
        {error ? (
          <View style={styles.center}>
            <Feather name="alert-triangle" size={30} color={theme.onDarkMeta} />
            <Text style={styles.errTxt}>Couldn't play this video. It may not have uploaded correctly — ask the office to re-upload it.</Text>
          </View>
        ) : (
          <Video
            ref={video}
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            useNativeControls={false}
            resizeMode={fill ? ResizeMode.COVER : ResizeMode.CONTAIN}
            isMuted={muted}
            onLoadStart={() => setLoading(true)}
            onReadyForDisplay={() => setLoading(false)}
            onPlaybackStatusUpdate={onStatus}
            onError={() => { setLoading(false); setError(true); }}
            shouldPlay
          />
        )}
      </Pressable>

      {(loading || buffering) && !error && (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {showUI && !error && (
        <>
          {/* Top scrim: back + title + mute */}
          <SafeAreaView edges={['top']} style={styles.topWrap} pointerEvents="box-none">
            <View style={styles.top}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
                <Feather name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              {!!title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              <TouchableOpacity style={styles.iconBtn} onPress={() => { setMuted((m) => !m); setShowUI(true); }} accessibilityLabel="Mute">
                <Feather name={muted ? 'volume-x' : 'volume-2'} size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Centre transport: skip back · play/pause · skip forward */}
          <View style={styles.centreRow} pointerEvents="box-none">
            <TouchableOpacity style={styles.skipBtn} onPress={() => skip(-SKIP_MS)} accessibilityLabel="Back 10 seconds">
              <Feather name="rotate-ccw" size={22} color="#fff" />
              <Text style={styles.skipTxt}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlay} accessibilityLabel={playing ? 'Pause' : 'Play'}>
              <Feather name={playing ? 'pause' : 'play'} size={30} color="#111" style={playing ? undefined : { marginLeft: 3 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => skip(SKIP_MS)} accessibilityLabel="Forward 10 seconds">
              <Feather name="rotate-cw" size={22} color="#fff" />
              <Text style={styles.skipTxt}>10</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom: elapsed · scrubber · duration · fill toggle */}
          <SafeAreaView edges={['bottom']} style={styles.bottomWrap} pointerEvents="box-none">
            <View style={styles.bottom}>
              <Text style={styles.time}>{fmt(pos)}</Text>

              <View
                ref={barRef}
                style={styles.barHit}
                onLayout={() => barRef.current?.measureInWindow((x, _y, w) => { barX.current = x; barW.current = w || 1; })}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => { setScrubbing(true); setPos(posFromX(e.nativeEvent.pageX)); }}
                onResponderMove={(e) => setPos(posFromX(e.nativeEvent.pageX))}
                onResponderRelease={(e) => { void seekTo(posFromX(e.nativeEvent.pageX)); setScrubbing(false); armHide(); }}
              >
                <View style={styles.barBg} />
                <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                <View style={[styles.knob, { left: `${pct * 100}%` }, scrubbing && styles.knobBig]} />
              </View>

              <Text style={styles.time}>{fmt(dur)}</Text>

              <TouchableOpacity style={styles.iconBtn} onPress={() => { setFill((f) => !f); setShowUI(true); }} accessibilityLabel="Zoom">
                <Feather name={fill ? 'minimize' : 'maximize'} size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
  errTxt: { color: theme.onDarkMeta, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },

  topWrap: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 10 },
  title: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  centreRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34,
  },
  playBtn: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center', justifyContent: 'center',
  },
  skipBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  skipTxt: { position: 'absolute', color: '#fff', fontSize: 9, fontWeight: '800', marginTop: 1 },

  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  time: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 38, textAlign: 'center' },

  barHit: { flex: 1, height: 30, justifyContent: 'center' },
  barBg: { position: 'absolute', left: 0, right: 0, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  barFill: { position: 'absolute', left: 0, height: 3.5, borderRadius: 2, backgroundColor: theme.purple },
  knob: { position: 'absolute', width: 13, height: 13, borderRadius: 7, backgroundColor: theme.purple, marginLeft: -6.5, top: 8.5 },
  knobBig: { width: 19, height: 19, borderRadius: 10, marginLeft: -9.5, top: 5.5 },
});
