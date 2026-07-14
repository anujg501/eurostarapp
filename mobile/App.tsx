import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { loadToken, setToken, api } from './src/api';
import { theme } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';

const Tab = createBottomTabNavigator();

function Header({ title, onSignOut }: { title: string; onSignOut: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={styles.headerWrap}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>eurostar</Text>
        <TouchableOpacity onPress={onSignOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </SafeAreaView>
  );
}

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

  const signOut = useCallback(async () => {
    await setToken(null);
    setSignedIn(false);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={theme.paper} size="large" />
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
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.emerald,
            tabBarInactiveTintColor: theme.ink3,
            tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
          }}
        >
          <Tab.Screen name="Home" options={{ tabBarLabel: 'Shop' }}>
            {() => (
              <View style={{ flex: 1 }}>
                <Header title="Shop" onSignOut={signOut} />
                <HomeScreen />
              </View>
            )}
          </Tab.Screen>
          <Tab.Screen name="Orders">
            {() => (
              <View style={{ flex: 1 }}>
                <Header title="Orders" onSignOut={signOut} />
                <OrdersScreen />
              </View>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: theme.emerald, alignItems: 'center', justifyContent: 'center' },
  headerWrap: { backgroundColor: theme.emerald },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6 },
  headerBrand: { color: theme.paper, fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  signOut: { color: theme.emeraldSoft, fontWeight: '600' },
  headerTitle: { color: theme.paper, fontSize: 26, fontWeight: '700', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
});
