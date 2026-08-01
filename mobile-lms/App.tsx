import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadToken, setToken, api } from './src/api';
import { theme } from './src/theme';
import { CandidateProvider } from './src/state';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ApplyScreen from './src/screens/ApplyScreen';
import StatusScreen from './src/screens/StatusScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import TestScreen from './src/screens/TestScreen';
import ResultScreen from './src/screens/ResultScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

// Phones ship with a "Font size" / "Display size" slider, and a candidate who
// has turned it up was getting a squeezed app: every label grew, fixed-height
// rows and buttons stayed put, and titles collapsed into one word per line.
// Text still scales with the phone setting — just not past a point where the
// screen stops being readable. Set once, for every Text/TextInput in the app.
const MAX_FONT_SCALE = 1.25;
type Defaultable = { defaultProps?: Record<string, unknown> };
(Text as unknown as Defaultable).defaultProps = {
  ...(Text as unknown as Defaultable).defaultProps,
  maxFontSizeMultiplier: MAX_FONT_SCALE,
};
(TextInput as unknown as Defaultable).defaultProps = {
  ...(TextInput as unknown as Defaultable).defaultProps,
  maxFontSizeMultiplier: MAX_FONT_SCALE,
};

type Profile = {
  watched?: string[];
  testConsumed?: boolean;
  name?: string;
  candId?: string | null;
  stage?: string;
  score?: number | null;
  applied?: boolean;
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | undefined>();

  // Who is signed in — the dashboard greets them by name and shows their
  // candidate id, so this has to be loaded on a fresh sign-in as well as on a
  // restored session.
  // Returns 'ok' | 'rejected' (the server said no) | 'unreachable'.
  const loadProfile = useCallback(async () => {
    try {
      const me = await api.me();
      // The pipeline row carries how far they actually are, so the dashboard
      // survives a restart instead of forgetting they already applied.
      const cand = await api.myCandidate().catch(() => null);
      setProfile({
        name: me.name,
        candId: me.candId ?? null,
        stage: cand?.stage,
        score: cand?.score ?? null,
        // The Apply form is what fills these in — registration does not.
        applied: !!(cand?.city && cand?.state && cand?.exp && cand?.source),
        // Journey progress belongs to the candidate, not to this handset: the
        // videos they have watched and whether the one attempt has been used
        // come from the server, so a second device starts where they left off.
        watched: Array.isArray(cand?.watched) ? cand!.watched : [],
        testConsumed: !!cand?.testConsumed,
      });
      return 'ok' as const;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log(`[auth] session check failed (${e?.status ?? 'network'}): ${e?.message ?? e}`);
      return e?.status === 401 || e?.status === 403 ? ('rejected' as const) : ('unreachable' as const);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        const result = await loadProfile();
        // Only an actual rejection ends the session. A back room that cannot be
        // reached must NOT sign the candidate out — that silently threw away a
        // perfectly valid login every time the network hiccuped at start-up.
        if (result === 'rejected') await setToken(null);
        else setSignedIn(true);
      }
      setReady(true);
    })();
  }, [loadProfile]);

  const onSignedIn = useCallback(() => {
    setSignedIn(true);
    void loadProfile();
  }, [loadProfile]);
  const signOut = useCallback(async () => {
    await setToken(null);
    setProfile(undefined);
    setSignedIn(false);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={theme.gold} size="large" />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <SafeAreaProvider>
        {/* Auth is a full-bleed white screen (matches the web candidate card). */}
        <StatusBar style="dark" />
        <AuthScreen onSignedIn={onSignedIn} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CandidateProvider profile={profile}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.bgMid },
              headerTintColor: theme.gold,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: theme.paper },
            }}
          >
            <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
              {(props) => <DashboardScreen {...props} onSignOut={signOut} />}
            </Stack.Screen>
            {/* Apply draws the web's own white app bar, so no stack header. */}
            <Stack.Screen name="Apply" component={ApplyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Status" component={StatusScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Training" component={TrainingScreen} options={{ headerShown: false }} />
            {/* Test draws its own app bar so the countdown timer sits beside the
                question counter, matching the web candidate flow. */}
            <Stack.Screen name="Test" component={TestScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            {/* What a hired candidate completes before their Sales App login
                goes live — the phone app had no way to reach any of it. */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            {/* Full-screen player, black app bar of its own — no light header. */}
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CandidateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.bgMid, alignItems: 'center', justifyContent: 'center' },
});
