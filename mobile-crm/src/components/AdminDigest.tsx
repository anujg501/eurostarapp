import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import type { Order, Rfq, Lead, Payment, Cart, Franchise, Visit, Rep, Customer } from '../api';

const money = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const BIG_CART = 100000; // the web calls a cart "big" at ₹1,00,000

type Tone = 'urgent' | 'warn' | 'info' | 'win';
const TONE_BG: Record<Tone, string> = {
  urgent: theme.rubySoft, warn: theme.amberSoft, info: theme.card, win: theme.emeraldSoft,
};
const TONE_FG: Record<Tone, string> = {
  urgent: theme.ruby, warn: theme.amber, info: theme.ink, win: theme.emeraldInk,
};

type Row = { icon: string; tone: Tone; title: string; detail: string; cta?: string; go?: string };

/**
 * The office dashboard's "what needs your attention" digest, ported row for row
 * from adminAttention() in the web console — same order, same thresholds, same
 * sentences.
 *
 * Every widget ALWAYS renders, exactly as it does on the web: an empty queue
 * shows "0 payments to verify — all clear" rather than disappearing, so the
 * dashboard keeps its shape and a clear queue is visibly clear rather than
 * merely absent.
 */
export default function AdminDigest({
  orders = [], payments = [], leads = [], rfqs = [], carts = [], franchise = [], visits = [],
  reps = [], customers = [], navigate,
}: {
  orders?: Order[]; payments?: Payment[]; leads?: Lead[]; rfqs?: Rfq[]; carts?: Cart[];
  franchise?: Franchise[]; visits?: Visit[]; reps?: Rep[]; customers?: Customer[];
  navigate: (t: string) => void;
}) {
  const rows = useMemo<Row[]>(() => {
    const A: Row[] = [];

    const pays = payments.filter((p) => p.status === 'pending');
    const payValue = pays.reduce((a, p) => a + (p.amount || 0), 0);
    A.push({
      icon: '💳', tone: pays.length ? 'urgent' : 'info',
      title: `${pays.length} payments to verify${pays.length ? ` · ${money(payValue)}` : ''}`,
      detail: pays.length
        ? 'Reps logged these — verify so customer balances update and reminders stop.'
        : 'No payments waiting for verification — all clear.',
      cta: 'Verify payments', go: 'Orders',
    });

    // The web keys this on status 'new'; this database calls the same state
    // 'pending' (see OPEN_ORDER_STATUSES in reports.ts).
    const newOrders = orders.filter((o) => o.status === 'pending');
    const newValue = newOrders.reduce((a, o) => a + (o.grand || 0), 0);
    A.push({
      icon: '📦', tone: newOrders.length ? 'urgent' : 'info',
      title: `${newOrders.length} new orders to confirm${newOrders.length ? ` · ${money(newValue)}` : ''}`,
      detail: newOrders.length
        ? 'Confirm and assign a courier so they move to packing.'
        : 'No orders waiting for confirmation.',
      cta: 'Open orders', go: 'Orders',
    });

    // Only shown when there are any — the web hides this one too.
    const openVisits = visits.filter((v) => !v.checkOut);
    if (openVisits.length) {
      A.push({
        icon: '📍', tone: 'warn',
        title: `${openVisits.length} field visit${openVisits.length > 1 ? 's' : ''} not checked out`,
        detail: 'Check-out needs the customer OTP. Unvalidated by 11:59pm = failed visit — follow up with the rep.',
        cta: 'View field visits',
      });
    }

    const flagged = leads.filter((l) => (l as any).flagged);
    const unassigned = leads.filter((l) => !(l as any).flagged && !l.rep);
    const toAssign = flagged.length + unassigned.length;
    A.push({
      icon: '🧲', tone: toAssign ? 'warn' : 'info',
      title: `${toAssign} leads to assign`,
      detail: toAssign
        ? `${flagged.length ? `${flagged.length} flagged as existing · ` : ''}${unassigned.length} waiting for a rep. Assign by city so nobody sits idle.`
        : 'No unassigned leads right now.',
      cta: 'Assign leads', go: 'Pipeline',
    });

    const overdueLeads = leads.filter((l) => l.rep && l.stage >= 1 && l.stage < 6 && !!l.followUp && l.followUp <= TODAY);
    A.push({
      icon: '⏰', tone: overdueLeads.length ? 'warn' : 'info',
      title: `${overdueLeads.length} follow-ups overdue across reps`,
      detail: overdueLeads.length
        ? 'Customers waiting on a rep call. Check the pipeline and nudge the owners.'
        : 'No overdue follow-ups — the pipeline is on schedule.',
      cta: 'Open pipeline', go: 'Pipeline',
    });

    const openRfq = rfqs.filter((q) => q.status === 'open');
    A.push({
      icon: '📝', tone: 'info',
      title: `${openRfq.length} RFQ enquiries open`,
      detail: openRfq.length
        ? 'Custom-item requests waiting for a quote. Slow replies lose the deal.'
        : 'No open RFQ enquiries.',
      cta: 'Open RFQs', go: 'Rfq',
    });

    const quotes = carts.filter((c) => c.status === 'quote-requested');
    const quoteValue = quotes.reduce((a, c) => a + (c.totals?.grand || 0), 0);
    A.push({
      icon: '💬', tone: 'info',
      title: `${quotes.length} quote requests${quotes.length ? ` · ${money(quoteValue)}` : ''}`,
      detail: quotes.length
        ? 'Customers asked for pricing on their cart — respond before it cools.'
        : 'No carts waiting on a quote.',
      cta: 'View carts',
    });

    const bigAband = carts.filter((c) => c.status === 'abandoned' && (c.totals?.grand || 0) >= BIG_CART);
    const abandValue = bigAband.reduce((a, c) => a + (c.totals?.grand || 0), 0);
    A.push({
      icon: '🛒', tone: 'info',
      title: `${bigAband.length} big carts abandoned${bigAband.length ? ` · ${money(abandValue)}` : ''}`,
      detail: bigAband.length
        ? 'High-value carts left unpaid. Have the rep call and recover them.'
        : 'No high-value abandoned carts.',
      cta: 'View carts',
    });

    const fr = franchise.filter((r) => r.status === 'new');
    A.push({
      icon: '🤝', tone: 'info',
      title: `${fr.length} franchise requests`,
      detail: fr.length
        ? 'New partnership enquiries from the Sales App — respond while interest is high.'
        : 'No new franchise enquiries.',
      cta: 'View requests',
    });

    return A;
  }, [orders, payments, leads, rfqs, carts, franchise, visits]);

  // "Your reps" — behind target, collections to push, top performer. Same three
  // as the web, computed per rep from their own customers and orders.
  const team = useMemo(() => {
    const byRep = reps.filter((r) => r.active !== false).map((r) => {
      const mine = customers.filter((c) => c.rep === r.repId);
      const added = mine.filter((c) => String(c.createdAt || '').slice(0, 7) === MONTH).length;
      const target = r.monthlyTarget || 0;
      const pct = target ? Math.round((added / target) * 100) : 0;
      const sales = orders
        .filter((o) => (o as any).repId === r.repId || (o as any).rep === r.name)
        .filter((o) => String(o.date || o.createdAt || '').slice(0, 7) === MONTH)
        .reduce((a, o) => a + (o.grand || 0), 0);
      return { rep: r, pct, added, target, sales };
    });
    return {
      behind: byRep.filter((x) => x.target > 0 && x.pct < 60).sort((a, b) => a.pct - b.pct),
      top: byRep.slice().sort((a, b) => b.sales - a.sales)[0],
      count: byRep.length,
    };
  }, [reps, customers, orders]);

  // "Collections to push" — what customers still owe. Confirmed payments net
  // off the order value; anything left on a delivered-or-shipped order is
  // outstanding. Shown as ₹0 rather than hidden when the ledger is clear.
  const outstanding = useMemo(() => {
    const paidByOrder = new Map<string, number>();
    payments.filter((p) => p.status === 'confirmed' && p.orderId).forEach((p) => {
      paidByOrder.set(p.orderId!, (paidByOrder.get(p.orderId!) || 0) + (p.amount || 0));
    });
    let total = 0;
    let count = 0;
    orders.filter((o) => ['delivered', 'shipped', 'packed', 'confirmed'].includes(o.status)).forEach((o) => {
      const due = (o.grand || 0) - (paidByOrder.get(o.id) || 0);
      if (due > 0) { total += due; count += 1; }
    });
    return { total, count };
  }, [orders, payments]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.avatar}><Text style={{ fontSize: 16 }}>💎</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mira Coach · What needs your attention</Text>
          <Text style={styles.sub}>Business to action today + reps to control</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
        {rows.map((it, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.sep]}>
            <View style={[styles.icon, { backgroundColor: TONE_BG[it.tone] }]}>
              <Text style={{ fontSize: 14 }}>{it.icon}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rowTitle, { color: TONE_FG[it.tone] }]}>{it.title}</Text>
              <Text style={styles.rowDetail}>{it.detail}</Text>
            </View>
            {!!it.cta && (
              <TouchableOpacity
                style={[styles.ghost, !it.go && { opacity: 0.45 }]}
                disabled={!it.go}
                onPress={() => it.go && navigate(it.go)}
              >
                <Text style={styles.ghostTxt}>{it.cta} →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.teamWrap}>
          <Text style={styles.teamLabel}>YOUR REPS</Text>

          {team.behind.length > 0 && (
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: TONE_BG.warn }]}><Text style={{ fontSize: 14 }}>🎯</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowTitle, { color: TONE_FG.warn }]}>
                  {team.behind.length} rep{team.behind.length > 1 ? 's' : ''} behind target
                </Text>
                <Text style={styles.rowDetail}>
                  {team.behind.slice(0, 4).map((x) => `${x.rep.name} (${x.pct}%)`).join(', ')} — prioritise in your calls.
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.row, team.behind.length > 0 && styles.sep]}>
            <View style={[styles.icon, { backgroundColor: outstanding.count ? TONE_BG.urgent : TONE_BG.info }]}>
              <Text style={{ fontSize: 14 }}>💰</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rowTitle, { color: outstanding.count ? TONE_FG.urgent : TONE_FG.info }]}>
                Collections to push
              </Text>
              <Text style={styles.rowDetail}>
                {outstanding.count
                  ? `${money(outstanding.total)} across ${outstanding.count} order${outstanding.count > 1 ? 's' : ''} — chase the oldest first.`
                  : '₹0 outstanding — no overdue customer balances right now.'}
              </Text>
            </View>
          </View>

          {!!team.top && (
            <View style={[styles.row, styles.sep]}>
              <View style={[styles.icon, { backgroundColor: TONE_BG.win }]}><Text style={{ fontSize: 14 }}>🏆</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowTitle, { color: TONE_FG.win }]}>Top performer · {team.top.rep.name}</Text>
                <Text style={styles.rowDetail}>
                  {money(team.top.sales)} MTD. Recognise the win and ask what's working.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, overflow: 'hidden', marginBottom: 18,
  },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.emerald,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { color: '#FDFAF2', fontSize: 14, fontWeight: '700' },
  sub: { color: 'rgba(253,250,242,0.82)', fontSize: 11.5, marginTop: 1 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 11 },
  sep: { borderTopWidth: 1, borderTopColor: theme.divider },
  icon: { width: 29, height: 29, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: '700' },
  rowDetail: { fontSize: 12.5, color: theme.meta, marginTop: 2, lineHeight: 18 },
  ghost: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 8, backgroundColor: theme.card,
    paddingHorizontal: 9, paddingVertical: 6, flexShrink: 0, maxWidth: 130,
  },
  ghostTxt: { fontSize: 11.5, fontWeight: '700', color: theme.ink2 },

  teamWrap: { marginTop: 12, paddingTop: 10, borderTopWidth: 2, borderTopColor: theme.divider },
  teamLabel: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: theme.meta, marginBottom: 2,
  },
});
