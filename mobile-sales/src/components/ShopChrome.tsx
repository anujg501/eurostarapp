import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { api } from '../api';
import { LANGS, useLang, useT, type Lang } from '../i18n';

const LOGO = require('../../assets/eurostar-logo.png');

// Remembered for the app run so every screen's avatar agrees.
let WHO = '';

export const initialsOf = (name: string) =>
  String(name || '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

/**
 * The storefront's header — brand bar, section tabs and search — carried on
 * every page exactly as the web does. The account page keeps it too; losing it
 * there was what made that screen feel like a different app.
 */
export function ShopHeader({
  navigation, current, who, q, onQ,
}: {
  navigation: any;
  current: 'Home' | 'Orders' | 'Join Franchise';
  who?: string;
  q?: string;
  onQ?: (v: string) => void;
}) {
  const T = useT();
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);

  // Screens that do not load the account themselves would otherwise show an
  // empty avatar. Fetch the name once per app run and share it.
  const [self, setSelf] = useState(WHO);
  React.useEffect(() => {
    if (who || WHO) return;
    api.me().then((m) => { WHO = m?.name || ''; setSelf(WHO); }).catch(() => {});
  }, [who]);
  const shownName = who || self;

  const Tab = ({ label, text, to }: { label: 'Home' | 'Orders' | 'Join Franchise'; text: string; to?: string }) => {
    const on = current === label;
    return (
      <TouchableOpacity
        style={[styles.tab, on && styles.tabOn]}
        disabled={!to || on}
        onPress={() => to && navigation.navigate(to)}
      >
        <Text style={on ? styles.tabTxtOn : styles.tabTxt}>{text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.wrap}>
      <View style={styles.bar}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Account')}
          accessibilityLabel="My account"
        >
          <Text style={styles.avatarTxt}>{initialsOf(shownName) || '—'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Alerts">
          <Feather name="bell" size={16} color={theme.ink2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setLangOpen(true)}
          accessibilityLabel={`Language: ${LANGS.find((l) => l.id === lang)?.en || 'English'}`}
        >
          <Feather name="globe" size={16} color={theme.ink2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Orders')} accessibilityLabel="Orders">
          <Feather name="shopping-bag" size={16} color={theme.ink2} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <Tab label="Home" text={T('nav_home', 'Home')} to="Home" />
        <Tab label="Orders" text={T('nav_orders', 'Orders')} to="Orders" />
        <Tab label="Join Franchise" text={T('nav_franchise', 'Join Franchise')} to="Franchise" />
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={theme.meta} />
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={onQ}
          placeholder={T('search_ph', 'Search products, grades, colours…')}
          placeholderTextColor={theme.meta}
          autoCorrect={false}
          // The search only filters the home grid; on other pages it is the
          // way back to browsing rather than a dead box.
          onFocus={() => { if (!onQ) navigation.navigate('Home'); }}
        />
      </View>

      {/* Choose language — the same seven the storefront offers, each in its
          own script with the English name beside it. */}
      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <TouchableOpacity style={styles.langMenu} activeOpacity={1}>
            <Text style={styles.langHead}>CHOOSE LANGUAGE</Text>
            {LANGS.map((l) => {
              const on = l.id === lang;
              return (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.langRow, on && styles.langRowOn]}
                  onPress={() => { setLang(l.id as Lang); setLangOpen(false); }}
                >
                  <Text style={styles.langNat}>{l.native}</Text>
                  <Text style={styles.langLat}>{l.en}</Text>
                  <View style={{ flex: 1 }} />
                  {on && <Feather name="check" size={15} color={theme.emeraldInk} />}
                </TouchableOpacity>
              );
            })}
            {/* The web says the same thing, and it is true: only part of the
                shop is translated so far. */}
            <Text style={styles.langNote}>Full translation rolling out · preview</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/** The company footer the storefront closes every page with. */
export function ShopFooter() {
  return (
    <View style={styles.footer}>
      <Image source={LOGO} style={[styles.logo, { marginBottom: 12 }]} resizeMode="contain" />
      <Text style={styles.fCo}>
        Eurostar Gem Technologies Inc. <Text style={styles.fMeta}>· Estd 1980</Text>
      </Text>

      <Text style={styles.fLabel}>Corporate office:</Text>
      <Text style={styles.fTxt}>101/103 Krishna Bhavan, Dhanji Street, Mumbai</Text>

      <Text style={styles.fLabel}>Branch:</Text>
      <Text style={styles.fTxt}>65A Kachwala Building, Dhanji Street, Mumbai</Text>

      <Text style={styles.fLabel}>Jaipur Branch:</Text>
      <Text style={styles.fTxt}>4th Floor, Goswami Bhavan, Jaipur 302016</Text>

      <Text style={styles.fLabel}>Hong Kong office:</Text>
      <Text style={styles.fTxt}>Unit No. 901, Hing Wah Center, Tokwawan, Kowloon, Hong Kong</Text>

      <View style={styles.fRule} />
      <Text style={styles.fMeta}>Trade desk · +91 77100 65480 · info@eurostar.com</Text>
      <Text style={styles.fMeta}>Mon–Sat 10:00–20:00 IST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.divider },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  logo: { height: 20, width: 78 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: theme.emerald,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: theme.surface,
  },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tab: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  tabOn: { backgroundColor: theme.paper },
  tabTxt: { fontSize: 13, fontWeight: '600', color: theme.meta },
  tabTxtOn: { fontSize: 13, fontWeight: '700', color: theme.ink },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 13,
    backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.border, borderRadius: 999,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: theme.ink },

  // The picker hangs under the header, as the web dropdown does.
  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.25)' },
  langMenu: {
    position: 'absolute', top: 96, right: 14, width: 250,
    backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.border,
    shadowColor: '#15130F', shadowOpacity: 0.18, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  langHead: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, color: theme.meta,
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8,
  },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  langRowOn: { backgroundColor: theme.emeraldSoft },
  langNat: { fontSize: 15, color: theme.ink },
  langLat: { fontSize: 12.5, color: theme.meta },
  langNote: {
    fontSize: 11, color: theme.meta, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: theme.divider, marginTop: 6,
  },

  footer: {
    marginTop: 34, paddingTop: 26, paddingHorizontal: 2,
    borderTopWidth: 1, borderTopColor: theme.divider,
  },
  fCo: { fontSize: 13.5, fontWeight: '700', color: theme.ink },
  fLabel: { fontSize: 12.5, fontWeight: '700', color: theme.ink2, marginTop: 12 },
  fTxt: { fontSize: 12.5, color: theme.meta, marginTop: 3, lineHeight: 18 },
  fRule: { height: 1, backgroundColor: theme.divider, marginTop: 20, marginBottom: 14 },
  fMeta: { fontSize: 12, color: theme.meta, lineHeight: 18 },
});
