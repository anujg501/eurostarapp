import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, loadRole, loadToken, setRole, setToken, type StaffRole } from './src/api';
import { theme } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import DeskScreen from './src/screens/DeskScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import OrdersScreen from './src/screens/OrdersScreen';

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

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        // A stored token is only worth trusting if the back room still accepts
        // it. A network hiccup must NOT sign a rep out mid-day, so only an
        // outright rejection clears the session.
        try {
          await api.me();
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
    setRoleState(null);
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
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoginScreen onSignedIn={(r) => setRoleState(r)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.paper } }}>
          <Stack.Screen name="Desk">
            {(props) => <DeskScreen {...props} role={role} onSignOut={signOut} />}
          </Stack.Screen>
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
});
