import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

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

export type NavItem = { id: string; label: string; badge?: number };

export const REP_NAV: NavItem[] = [
  { id: 'Desk', label: 'My desk' },
  { id: 'Pipeline', label: 'Pipeline & follow-ups' },
  { id: 'Rfq', label: 'My RFQs' },
  { id: 'Customers', label: 'My customers' },
  { id: 'Orders', label: 'Orders' },
];

// Office and admin work the whole book rather than one rep's, so their rail
// leads with the order desk. Both roles read the same screens; the server
// decides how much data comes back.
export const STAFF_NAV: NavItem[] = [
  { id: 'Desk', label: 'Dashboard' },
  { id: 'Orders', label: 'Order desk' },
  { id: 'Customers', label: 'Customers' },
  { id: 'Pipeline', label: 'Relation-Pipeline' },
  { id: 'Rfq', label: 'RFQ Enquiries' },
];

export function navFor(role: string): NavItem[] {
  return role === 'rep' ? REP_NAV : STAFF_NAV;
}

export const ROLE_TITLE: Record<string, string> = {
  rep: 'Sales Rep',
  office: 'Back Office',
  admin: 'Administration',
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
          <Text style={styles.roleChipTxt}>{ROLE_TITLE[role] || role}</Text>
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
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{n.label}</Text>
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
  return (
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
      {!!action && (
        <TouchableOpacity style={styles.headBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.headBtnTxt}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
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
