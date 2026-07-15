import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { loadToken, setToken, api } from './src/api';
import { theme } from './src/theme';
import { CartProvider, useCart } from './src/cart';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import CartScreen from './src/screens/CartScreen';
import CheckInScreen from './src/screens/CheckInScreen';

const Tab = createBottomTabNavigator();
const ShopStack = createNativeStackNavigator();

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

function ShopFlow({ onSignOut }: { onSignOut: () => void }) {
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.emerald },
        headerTintColor: theme.paper,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ShopStack.Screen
        name="Categories"
        component={HomeScreen}
        options={{
          title: 'Shop',
          headerRight: () => (
            <TouchableOpacity onPress={onSignOut}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ShopStack.Screen
        name="Products"
        component={ProductsScreen}
        options={({ route }: any) => ({ title: route?.params?.name || 'Products' })}
      />
    </ShopStack.Navigator>
  );
}

// Small badge on the Cart tab showing the number of distinct items.
function CartTabLabel({ color }: { color: string }) {
  const { count } = useCart();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>Cart</Text>
      {count > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{count}</Text></View>
      ) : null}
    </View>
  );
}

function MainTabs({ onSignOut, staff }: { onSignOut: () => void; staff: boolean }) {
  const tabScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: theme.emerald,
    tabBarInactiveTintColor: theme.ink3,
    tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
  };
  // Staff (reps/office/admin): field check-in + their orders. No shopping cart.
  if (staff) {
    return (
      <NavigationContainer>
        <Tab.Navigator screenOptions={tabScreenOptions}>
          <Tab.Screen name="Check-in">
            {() => (
              <View style={{ flex: 1 }}>
                <Header title="Check in / out" onSignOut={onSignOut} />
                <CheckInScreen />
              </View>
            )}
          </Tab.Screen>
          <Tab.Screen name="Orders">
            {() => (
              <View style={{ flex: 1 }}>
                <Header title="Orders" onSignOut={onSignOut} />
                <OrdersScreen />
              </View>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
  // Customers: shop, cart, orders.
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="Shop">{() => <ShopFlow onSignOut={onSignOut} />}</Tab.Screen>
        <Tab.Screen name="Cart" options={{ tabBarLabel: ({ color }) => <CartTabLabel color={color} /> }}>
          {() => (
            <View style={{ flex: 1 }}>
              <Header title="Cart" onSignOut={onSignOut} />
              <CartScreenWithNav />
            </View>
          )}
        </Tab.Screen>
        <Tab.Screen name="Orders">
          {() => (
            <View style={{ flex: 1 }}>
              <Header title="Orders" onSignOut={onSignOut} />
              <OrdersScreen />
            </View>
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// CartScreen needs tab navigation (to jump to Shop/Orders); the tab render prop
// doesn't pass it, so we grab it via a thin wrapper using the navigation hook.
function CartScreenWithNav() {
  const navigation = useNavigation();
  return <CartScreen navigation={navigation} />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<string>('customer');

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          const me = await api.me();
          setRole(me.role || 'customer');
          setSignedIn(true);
        } catch {
          await setToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const completeSignIn = useCallback(async () => {
    try {
      const me = await api.me();
      setRole(me.role || 'customer');
    } catch {
      setRole('customer');
    }
    setSignedIn(true);
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
        <LoginScreen onSignedIn={completeSignIn} />
      </SafeAreaProvider>
    );
  }

  const staff = role === 'rep' || role === 'office' || role === 'admin';
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <CartProvider>
        <MainTabs onSignOut={signOut} staff={staff} />
      </CartProvider>
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
  badge: { marginLeft: 6, backgroundColor: theme.emerald, borderRadius: 99, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: theme.paper, fontSize: 11, fontWeight: '800' },
});
