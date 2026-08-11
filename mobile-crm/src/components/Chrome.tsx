import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { LANGS, useLang, useT, type Lang } from '../i18n';

const LOGO = require('../../assets/eurostar-logo.png');

// The CRM's own chrome, carried over from the web app so a rep recognises the
// product on either screen:
//
//   • a dark brand bar (the web sidebar's head), and
//   • a horizontally scrolling rail of section chips — which is exactly what
//     the web CRM collapses its sidebar into on a phone (.crm-mobnav).
//
// The rail is the navigation, so every chip goes somewhere real. A section the
// app does not have yet is simply not listed, rather than shown dead.

// `k` is the i18n key; `label` is the English fallback used when that key has no
// translation — the same convention as NAV in the web CRM.
export type NavItem = { id: string; label: string; k?: string; badge?: number };

export const REP_NAV: NavItem[] = [
  { id: 'Desk', label: 'My desk' },
  { id: 'Pipeline', label: 'Pipeline & follow-ups' },
  { id: 'Rfq', label: 'My RFQs' },
  { id: 'Customers', label: 'My customers' },
  { id: 'Commission', label: 'My commission' },
  { id: 'Orders', label: 'Orders', k: 'crm_orders' },
];

// The back office lands on the ORDER DESK, not a dashboard — that is the job,
// and it is what the web console opens for this role (NAV.office starts at
// 'orders'). The sections after it are the queues that feed the desk.
export const OFFICE_NAV: NavItem[] = [
  { id: 'Orders', label: 'Order desk', k: 'crm_orderdesk' },
  { id: 'Payments', label: 'Payments', k: 'crm_payments' },
  { id: 'Leads', label: 'Leads', k: 'crm_leads' },
  { id: 'Pipeline', label: 'Relation-Pipeline', k: 'crm_pipeline' },
  { id: 'Carts', label: 'Carts' },
  { id: 'Rfq', label: 'RFQ Enquiries', k: 'crm_rfq' },
  { id: 'Customers', label: 'Customers', k: 'crm_customers' },
];

// Administration runs the business, so it opens on the dashboard and adds the
// team plus the two things only the office owns: franchise enquiries and the
// broadcast to the field.
export const ADMIN_NAV: NavItem[] = [
  { id: 'Desk', label: 'Dashboard', k: 'crm_dashboard' },
  ...OFFICE_NAV,
  { id: 'Team', label: 'Reps & attendance' },
  { id: 'Visits', label: 'Field Visits', k: 'crm_visits' },
  { id: 'Franchise', label: 'Franchise & broadcast' },
];

/** One thing waiting on this person. Built by the desk from what it loaded. */
export type Notice = { icon: string; title: string; sub: string; go?: string };

/**
 * The bell and the language picker belong beside the page title, on the cream
 * bar — that is where the web console puts them. But the notices are owned by
 * the shell and the title is drawn by each screen, so rather than thread the
 * list through five screens that do not care about it, the shell publishes it
 * here and PageHead reads it.
 */
export const ChromeContext = React.createContext<{
  notices: Notice[];
  navigate: (t: string) => void;
  onSignOut?: () => void;
}>({
  notices: [],
  navigate: () => {},
});

export function navFor(role: string): NavItem[] {
  if (role === 'rep') return REP_NAV;
  return role === 'admin' ? ADMIN_NAV : OFFICE_NAV;
}

export const ROLE_TITLE: Record<string, string> = {
  rep: 'Sales Rep',
  office: 'Back Office',
  admin: 'Administration',
};
const ROLE_KEY: Record<string, string> = {
  rep: 'crm_role_rep',
  office: 'crm_role_office',
  admin: 'crm_title_admin',
};

/**
 * Brand bar + chip rail. `current` is the route name of the screen showing it,
 * so the active chip matches wherever the rep actually is.
 */
export function CrmChrome({
  role,
  current,
  navigation,
  badges,
}: {
  role: string;
  current: string;
  navigation: any;
  badges?: Record<string, number>;
}) {
  const items = navFor(role);
  const T = useT();
  // Deliberately the inset hook rather than <SafeAreaView edges={['top']}>.
  // SafeAreaView measures itself natively and applies its padding a frame after
  // mount, so on every screen push this bar rendered at zero inset and then
  // jumped to full height — the shrink-then-grow you see when changing tabs.
  // The hook reads the inset straight from the provider, so the bar is the
  // right height on its first frame. Same pixels, no jump.
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.brand}>
        {/* The logo is a wide wordmark (1080×278), not a square mark — it has to
            keep that ratio or it renders as a squashed sliver. It is dark ink on
            transparent, so on this navy bar it is tinted to the chrome's own
            cream; untinted it is invisible. The wordmark already says
            "Eurostar", so only the product name is set beside it. */}
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <View style={styles.divider} />
        <Text style={styles.brandSub}>CRM</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.roleChip}>
          <Text style={styles.roleChipTxt}>{T(ROLE_KEY[role] || '', ROLE_TITLE[role] || role)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        // A chip half off the edge is the hint that the rail scrolls.
        decelerationRate="fast"
      >
        {items.map((n) => {
          const on = n.id === current;
          const badge = badges?.[n.id];
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.chip, on && styles.chipOn]}
              activeOpacity={0.8}
              // Re-tapping the chip you are already on should do nothing rather
              // than stack another copy of the screen on the back stack.
              onPress={() => { if (!on) navigation.navigate(n.id); }}
            >
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{T(n.k || '', n.label)}</Text>
              {!!badge && (
                <View style={[styles.badge, on && styles.badgeOn]}>
                  <Text style={styles.badgeTxt}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * A bottom sheet. The web console drops these open as popovers under the bell
 * and the globe; on a phone the same content belongs at thumb height.
 */
function Sheet({
  visible, title, sub, onClose, children,
}: {
  visible: boolean; title: string; sub?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping the dimmed area closes it, the way a popover closes on a click
          outside in the web console. */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {!!sub && <Text style={styles.sheetSub}>{sub}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * The page head under the chrome: who you are and where you are, plus one
 * primary action. Mirrors .crm-top in the web CRM.
 */
export function PageHead({
  title,
  sub,
  action,
  onAction,
  onBack,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
  onBack?: () => void;
}) {
  const { notices, navigate, onSignOut } = React.useContext(ChromeContext);
  const { lang, setLang } = useLang();
  const [bellOpen, setBellOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langName = LANGS.find((l) => l.id === lang)?.native ?? 'English';

  // Signing out used to live at the foot of the desk — which the back office
  // never sees, since it lands on the order desk. Putting it in the page head
  // means every role can leave from wherever they happen to be.
  const signOut = () => {
    if (!onSignOut) return;
    Alert.alert('Sign out?', 'You will need your username and password to get back in.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
    ]);
  };

  return (
    <>
      <View style={styles.head}>
        {!!onBack && (
          <TouchableOpacity style={styles.back} onPress={onBack} accessibilityLabel="Back">
            <Text style={styles.backTxt}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headTitle} numberOfLines={1}>{title}</Text>
          {!!sub && <Text style={styles.headSub} numberOfLines={1}>{sub}</Text>}
        </View>

        {/* Bell and language, on the cream bar beside the title — where the web
            console keeps them. Outlined, not filled: they are utilities, and
            the one filled button on this row is the page's real action. */}
        <TouchableOpacity
          style={styles.headIcon}
          onPress={() => setBellOpen(true)}
          accessibilityLabel={`Notifications, ${notices.length} waiting`}
        >
          <Text style={styles.headIconTxt}>🔔</Text>
          {notices.length > 0 && (
            <View style={styles.bellDot}><Text style={styles.bellDotTxt}>{notices.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.headIcon} onPress={() => setLangOpen(true)} accessibilityLabel={`Language: ${langName}`}>
          <Text style={styles.headIconTxt}>🌐</Text>
        </TouchableOpacity>

        {!!onSignOut && (
          // A real vector glyph, not a character: ⏻ (U+23FB) is absent from the
          // system font on this phone and rendered as an empty box. The icon
          // font ships with the app, so it draws the same everywhere.
          <TouchableOpacity style={styles.headIcon} onPress={signOut} accessibilityLabel="Sign out">
            <MaterialIcons name="logout" size={17} color={theme.ink2} />
          </TouchableOpacity>
        )}

        {!!action && (
          <TouchableOpacity style={styles.headBtn} onPress={onAction} activeOpacity={0.85}>
            <Text style={styles.headBtnTxt}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Sheet
        visible={bellOpen}
        title="Notifications"
        sub={notices.length ? `${notices.length} waiting` : undefined}
        onClose={() => setBellOpen(false)}
      >
        <FlatList
          data={notices}
          keyExtractor={(_, i) => String(i)}
          ListEmptyComponent={<Text style={styles.sheetEmpty}>Nothing waiting on you right now.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.notice}
              activeOpacity={item.go ? 0.7 : 1}
              onPress={() => { if (item.go) { setBellOpen(false); navigate(item.go); } }}
            >
              <Text style={styles.noticeIcon}>{item.icon}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.noticeTitle}>{item.title}</Text>
                <Text style={styles.noticeSub}>{item.sub}</Text>
              </View>
              {!!item.go && <Text style={styles.chev}>›</Text>}
            </TouchableOpacity>
          )}
        />
      </Sheet>

      <Sheet visible={langOpen} title="Language" onClose={() => setLangOpen(false)}>
        {LANGS.map((l) => {
          const on = l.id === lang;
          return (
            <TouchableOpacity
              key={l.id}
              style={[styles.langRow, on && styles.langRowOn]}
              onPress={() => { setLang(l.id as Lang); setLangOpen(false); }}
            >
              <Text style={[styles.langTxt, on && styles.langTxtOn]}>{l.native}</Text>
              {on && <Text style={styles.langTick}>✓</Text>}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.sheetFoot}>
          Trade terms — shapes, sizes and grades — stay in English, as they do on the web console.
        </Text>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.side },

  brand: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
  },
  // 1080×278 ≈ 3.88:1. Height 20 → width 78 keeps the wordmark true.
  logo: { height: 20, width: 78, tintColor: theme.sideFg },
  divider: { width: 1, height: 16, backgroundColor: theme.sideBorder },
  brandSub: { color: theme.gold, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },
  roleChip: {
    borderWidth: 1, borderColor: theme.sideBorder, backgroundColor: theme.sideHover,
    borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, flexShrink: 0,
  },
  roleChipTxt: { color: theme.sideFg, fontSize: 11.5, fontWeight: '700' },

  headIcon: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexShrink: 0,
  },
  headIconTxt: { fontSize: 14 },
  bellDot: {
    position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4,
    borderRadius: 999, backgroundColor: theme.ruby, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: theme.surface,
  },
  bellDotTxt: { color: '#fff', fontSize: 9.5, fontWeight: '800' },

  backdrop: { flex: 1, backgroundColor: 'rgba(21,19,15,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 26, maxHeight: '75%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: theme.ink },
  sheetSub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  sheetClose: { fontSize: 18, color: theme.meta, paddingHorizontal: 6 },
  sheetEmpty: { fontSize: 13, color: theme.meta, paddingVertical: 20, textAlign: 'center' },
  sheetFoot: { fontSize: 11.5, color: theme.meta, marginTop: 14, lineHeight: 17, textAlign: 'center' },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  noticeIcon: { fontSize: 17, flexShrink: 0 },
  noticeTitle: { fontSize: 13.5, fontWeight: '700', color: theme.ink },
  noticeSub: { fontSize: 12, color: theme.meta, marginTop: 2 },
  chev: { fontSize: 20, color: theme.meta, flexShrink: 0 },

  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 11, marginBottom: 6,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
  },
  langRowOn: { backgroundColor: theme.emeraldSoft, borderColor: theme.emerald },
  langTxt: { flex: 1, fontSize: 15, color: theme.ink },
  langTxtOn: { fontWeight: '700', color: theme.emeraldInk },
  langTick: { fontSize: 15, fontWeight: '800', color: theme.emeraldInk },

  rail: { paddingHorizontal: 12, paddingBottom: 11, gap: 7 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999,
    backgroundColor: theme.sideHover, borderWidth: 1, borderColor: 'transparent',
  },
  chipOn: { backgroundColor: theme.emerald, borderColor: 'rgba(255,255,255,0.22)' },
  chipTxt: { color: theme.sideFgMuted, fontSize: 12.5, fontWeight: '600' },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  badge: {
    minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center',
  },
  badgeOn: { backgroundColor: 'rgba(0,0,0,0.22)' },
  badgeTxt: { color: theme.sideFg, fontSize: 10.5, fontWeight: '800' },

  head: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.divider,
  },
  back: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backTxt: { fontSize: 21, color: theme.ink, marginTop: -3 },
  headTitle: { fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.2 },
  headSub: { fontSize: 12.5, color: theme.meta, marginTop: 2 },
  headBtn: {
    backgroundColor: theme.emerald, borderRadius: 9,
    paddingHorizontal: 13, paddingVertical: 9, flexShrink: 0,
  },
  headBtnTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
});
