import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { theme } from '../theme';
import { ChromeContext, CrmChrome, navFor, type Notice } from '../components/Chrome';
import DeskScreen from './DeskScreen';
import CustomersScreen from './CustomersScreen';
import OrdersScreen from './OrdersScreen';
import PipelineScreen from './PipelineScreen';
import RfqScreen from './RfqScreen';
import CommissionScreen from './CommissionScreen';
import PaymentsScreen from './PaymentsScreen';
import LeadsScreen from './LeadsScreen';
import TeamScreen from './TeamScreen';
import FieldVisitsScreen from './FieldVisitsScreen';
import FranchiseScreen from './FranchiseScreen';
import CartsScreen from './CartsScreen';

// Every id in a role's rail must appear here, or its chip leads nowhere.
const BODIES: Record<string, React.ComponentType<any>> = {
  Desk: DeskScreen,
  Customers: CustomersScreen,
  Orders: OrdersScreen,
  Pipeline: PipelineScreen,
  Rfq: RfqScreen,
  Commission: CommissionScreen,
  Payments: PaymentsScreen,
  Leads: LeadsScreen,
  Team: TeamScreen,
  Visits: FieldVisitsScreen,
  Franchise: FranchiseScreen,
  Carts: CartsScreen,
};

/**
 * All five sections live in this one screen.
 *
 * They used to be five entries in the stack navigator, so every chip tap pushed
 * a whole new screen: the dark chrome was torn down and rebuilt, the incoming
 * screen ran its fetch from nothing, and the navigator slid the old one out.
 * That is the jump you see on each tab change — not padding, not the safe area,
 * but the screen itself being replaced.
 *
 * Here the chrome is mounted once and never re-renders on a tab change. A
 * section is mounted the first time it is opened and then kept alive behind
 * `display: 'none'`, so returning to it is instant and shows what it already
 * had. Changing tab is a `setState`, so there is nothing to animate, nothing to
 * remount and nothing to re-measure.
 *
 * Nothing about the layout changes: the same bar, the same page heads, the same
 * bodies, in the same places.
 */
export default function Shell({ navigation, role, repId, onSignOut }: any) {
  const sections = useMemo(() => navFor(role).map((n) => n.id), [role]);
  // Each role opens on its own first section — the back office has no dashboard
  // at all, it lands on the order desk, which is what the web console does.
  const home = sections[0];
  const [section, setSection] = useState(home);
  // Only what has actually been opened is mounted; the rest costs nothing.
  const [mounted, setMounted] = useState<string[]>([home]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  // What the bell shows. The desk builds it from the records it already loaded,
  // so the bell never runs a fetch of its own and never shows a count that is
  // not backed by something real.
  const [notices, setNotices] = useState<Notice[]>([]);

  // Sections report their own badge numbers as they load, so the rail shows
  // real counts without fetching a second time just for the badges — and the
  // counts no longer come and go depending on which tab drew the bar.
  const reportCounts = useCallback((c: Record<string, number>) => {
    setCounts((prev) => {
      const changed = Object.keys(c).some((k) => prev[k] !== c[k]);
      return changed ? { ...prev, ...c } : prev;
    });
  }, []);

  const go = useCallback((target: string, params?: any) => {
    // A section is a state change. Anything else — Add customer — is a real
    // push on the stack, where a slide in and a back button are wanted.
    if (BODIES[target] && sections.includes(target)) {
      setMounted((m) => (m.includes(target) ? m : [...m, target]));
      setSection(target);
      return;
    }
    navigation.navigate(target, params);
  }, [navigation, sections]);

  // Android's back button steps back to this role's home section rather than
  // closing the app — the chips replaced the back stack, so restore that much.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (section !== home) { setSection(home); return true; }
      return false;
    });
    return () => sub.remove();
  }, [section, home]);

  const nav = useMemo(() => sectionNavigation(go), [go]);
  // Published so each screen's PageHead can draw the bell without every screen
  // having to carry the notice list around.
  const chrome = useMemo(() => ({ notices, navigate: go }), [notices, go]);

  return (
    <ChromeContext.Provider value={chrome}>
    <View style={styles.wrap}>
      <CrmChrome role={role} current={section} navigation={nav} badges={counts} />
      {sections.map((id) => {
        if (!mounted.includes(id)) return null;
        const Body = BODIES[id];
        const active = id === section;
        return (
          <View
            key={id}
            style={[styles.body, !active && styles.hidden]}
            pointerEvents={active ? 'auto' : 'none'}
          >
            <Body
              role={role}
              repId={repId}
              active={active}
              onSignOut={onSignOut}
              onCounts={reportCounts}
              onNotices={setNotices}
              navigation={nav}
              route={{ params: { role, repId } }}
            />
          </View>
        );
      })}
    </View>
    </ChromeContext.Provider>
  );
}

/**
 * The sections were written against a navigator, so hand them something that
 * behaves like one. `navigate` switches section (or pushes, for Add customer);
 * `goBack` returns to the desk, which is what the back chevron on a section
 * page head now means.
 */
function sectionNavigation(go: (t: string, p?: any) => void) {
  return {
    navigate: go,
    push: go,
    goBack: () => go('Desk'),
    // Sections stay mounted, so there is no focus event to subscribe to; they
    // reload from the `active` prop instead. A no-op unsubscribe keeps any
    // remaining call site harmless.
    addListener: () => () => {},
  };
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.paper },
  body: { flex: 1 },
  hidden: { display: 'none' },
});
