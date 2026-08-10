import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { api, loadRole, loadToken, setRole, setToken, type StaffRole } from './src/api';
import { theme } from './src/theme';
import { LangContext, loadLang, saveLang, type Lang } from './src/i18n';
import LoginScreen from './src/screens/LoginScreen';
import Shell from './src/screens/Shell';
import AddCustomerScreen from './src/screens/AddCustomerScreen';

const Stack = createNativeStackNavigator();

// Phones ship with a "Font size" slider, and a staff member who has turned it
// up should still get a usable screen: text scales with the phone setting, but
// not past the point where fixed rows and figures stop fitting.
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

export default function App() {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<StaffRole | null>(null);
  // The rep's public id (REP-204). Enquiries are routed on it, so the RFQ
  // screen needs it to know which of them are on this rep's name.
  const [repId, setRepId] = useState<string | undefined>();
  // Stored under the same key the web console uses, so a rep who picked a
  // language there finds it already chosen here.
  const [lang, setLangState] = useState<Lang>('en');
  const setLang = useCallback((l: Lang) => { setLangState(l); saveLang(l).catch(() => {}); }, []);

  useEffect(() => {
    (async () => {
      setLangState(await loadLang().catch(() => 'en' as Lang));
      const token = await loadToken();
      if (token) {
        // A stored token is only worth trusting if the back room still accepts
        // it. A network hiccup must NOT sign a rep out mid-day, so only an
        // outright rejection clears the session.
        try {
          const me = await api.me();
          setRepId(me.repId);
          setRoleState((await loadRole()) || 'rep');
        } catch (e: any) {
          if (e?.status === 401 || e?.status === 403) {
            await setToken(null);
            await setRole(null);
          } else {
            setRoleState((await loadRole()) || 'rep');
          }
        }
      }
      setReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    await setRole(null);
    setRepId(undefined);
    setRoleState(null);
  }, []);

  const signedIn = useCallback(async (r: StaffRole) => {
    setRoleState(r);
    // Fetch the rep id straight after sign-in; without it the RFQ screen cannot
    // tell "on my name" from everybody else's.
    try { setRepId((await api.me()).repId); } catch { /* the desk still loads */ }
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={theme.emerald} size="large" />
      </View>
    );
  }

  if (!role) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="dark" />
        <LoginScreen onSignedIn={signedIn} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {/* The CRM chrome is dark, so the status bar icons must be light. */}
      <StatusBar style="light" />
      <LangContext.Provider value={{ lang, setLang }}>
      <NavigationContainer>
        {/* The five sections are NOT five stack screens — they all live inside
            Shell, which keeps the chrome mounted and switches bodies with a
            setState. Pushing them was what made every tab change flicker.
            Add customer stays a real push: there a slide and a back button are
            exactly what is wanted. */}
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.paper } }}>
          <Stack.Screen name="Main">
            {(props) => <Shell {...props} role={role} repId={repId} onSignOut={signOut} />}
          </Stack.Screen>
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </LangContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
});
