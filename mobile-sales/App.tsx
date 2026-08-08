import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, loadToken, setToken } from './src/api';
import { theme } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import OrdersScreen from './src/screens/OrdersScreen';

const Stack = createNativeStackNavigator();

// Text still follows the phone's font-size setting, capped where fixed rows and
// prices would otherwise stop fitting.
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
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        // A stored token is worth trusting until the back room says otherwise.
        // A network hiccup must not sign a customer out mid-order, so only an
        // outright rejection clears the session.
        try {
          await api.me();
          setSignedIn(true);
        } catch (e: any) {
          if (e?.status === 401 || e?.status === 403) await setToken(null);
          else setSignedIn(true);
        }
      }
      setReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setSignedIn(false);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={theme.emerald} size="large" />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen onSignedIn={() => setSignedIn(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.paper } }}>
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} onSignOut={signOut} />}
          </Stack.Screen>
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
});
