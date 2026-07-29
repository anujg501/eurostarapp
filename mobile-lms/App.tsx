import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          await api.me();
          setSignedIn(true);
        } catch {
          await setToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const onSignedIn = useCallback(() => setSignedIn(true), []);
  const signOut = useCallback(async () => {
    await setToken(null);
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
      <CandidateProvider>
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
            <Stack.Screen name="Apply" component={ApplyScreen} options={{ title: 'Apply Now' }} />
            <Stack.Screen name="Status" component={StatusScreen} options={{ title: 'My Status' }} />
            <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Training' }} />
            <Stack.Screen name="Test" component={TestScreen} options={{ title: 'Assessment' }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CandidateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.bgMid, alignItems: 'center', justifyContent: 'center' },
});
