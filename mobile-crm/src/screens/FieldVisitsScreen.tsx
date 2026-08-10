import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { api, type Visit, type Rep, type Customer } from '../api';
import { theme } from '../theme';
import { PageHead } from '../components/Chrome';

const TODAY = new Date().toISOString().slice(0, 10);
const at = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const dayLabel = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// Open past the end of its day = the rep never checked out.
const failed = (v: Visit) => !v.checkOut && !!v.day && Date.now() > new Date(`${v.day}T23:59:59`).getTime();

const spent = (ms: number) => {
  const m = Math.floor(Math.max(0, ms) / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};
const running = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s % 60)}` : `${m}:${p(s % 60)}`;
};

/**
 * Field Visits, for the office: where each rep went, when, and how long they
 * actually sat with the customer.
 *
 * The point of the screen is supervision, so it answers three questions in
 * order: who is out right now, how much time each rep put in today, and then
 * the visit-by-visit detail with the location captured at check-in.
 */
export default function FieldVisitsScreen({ navigation, active = true, onCounts }: any) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [err, setErr] = useState('');
  const [day, setDay] = useState(TODAY);
  const [repF, setRepF] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = () => {
    Promise.all([api.visits().catch(() => []), api.reps().catch(() => []), api.customers().catch(() => [])])
      .then(([v, r, c]) => {
        setVisits(Array.isArray(v) ? v : []);
        setReps(Array.isArray(r) ? r : []);
        setCustomers(Array.isArray(c) ? c : []);
      })
      .catch((e) => { setErr(e?.message || 'Could not load field visits.'); setVisits([]); });
  };
  useEffect(() => { if (active) load(); }, [active]);

  // Anyone still checked in today — the number the office watches.
  const inField = (visits || []).filter((v) => !v.checkOut && !failed(v));
  useEffect(() => { if (visits) onCounts?.({ Visits: inField.length }); }, [onCounts, visits, inField.length]);

  // The clock only ticks while somebody is actually out.
  useEffect(() => {
    if (!inField.length) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [inField.length]);

  // Today is always offered, even before the first visit of the day is logged.
  const days = useMemo(() => {
    const set = new Set<string>([TODAY]);
    (visits || []).forEach((v) => v.day && set.add(v.day));
    return [...set].sort().reverse();
  }, [visits]);

  const custOf = (v: Visit) => customers.find((c) => c.id === v.custId);
  const repName = (id?: string) => reps.find((r) => r.repId === id)?.name || id || '—';

  const shown = useMemo(
    () => (visits || [])
      .filter((v) => v.day === day && (!repF || v.rep === repF))
      .sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn))),
    [visits, day, repF]
  );

  // Time in the field per rep for the chosen day — an open visit counts up to now.
  const summary = useMemo(() => {
    return reps
      .map((r) => {
        const vs = (visits || []).filter((v) => v.rep === r.repId && v.day === day);
        const total = vs.reduce((s, v) => {
          const end = v.checkOut ? new Date(v.checkOut).getTime() : failed(v) ? new Date(v.checkIn || 0).getTime() : now;
          return s + (end - new Date(v.checkIn || 0).getTime());
        }, 0);
        return { rep: r, count: vs.length, total, live: vs.some((v) => !v.checkOut && !failed(v)) };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [reps, visits, day, now]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <PageHead
        title="Field Visits"
        sub="Where each rep went, when, and how long they met the customer"
        onBack={() => navigation.goBack()}
      />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : visits === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {inField.length > 0 && (
                <View style={styles.liveBar}>
                  <Text style={styles.liveTxt}>
                    ● {inField.length} rep{inField.length > 1 ? 's' : ''} in the field right now
                  </Text>
                </View>
              )}

              <Text style={styles.filterLabel}>DAY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {days.map((d) => {
                  const on = d === day;
                  return (
                    <TouchableOpacity key={d} style={[styles.chip, on && styles.chipOn]} onPress={() => setDay(d)}>
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                        {d === TODAY ? 'Today' : dayLabel(d)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {reps.length > 1 && (
                <>
                  <Text style={styles.filterLabel}>REP</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    <TouchableOpacity style={[styles.chip, !repF && styles.chipOn]} onPress={() => setRepF('')}>
                      <Text style={[styles.chipTxt, !repF && styles.chipTxtOn]}>All reps</Text>
                    </TouchableOpacity>
                    {reps.map((r) => {
                      const on = repF === r.repId;
                      return (
                        <TouchableOpacity key={r.repId} style={[styles.chip, on && styles.chipOn]} onPress={() => setRepF(r.repId)}>
                          <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{r.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {summary.length > 0 && (
                <View style={styles.kpis}>
                  {summary.map((s) => (
                    <View key={s.rep.repId} style={styles.kpi}>
                      <Text style={styles.kpiLabel} numberOfLines={1}>
                        {s.rep.name}{s.live ? '  ● live' : ''}
                      </Text>
                      <Text style={styles.kpiValue}>{s.count}</Text>
                      <Text style={styles.kpiSub}>
                        {spent(s.total)} in field · {s.count} visit{s.count > 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sec}>
                {shown.length} visit{shown.length === 1 ? '' : 's'} · {day === TODAY ? 'today' : dayLabel(day)}
              </Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>No visits recorded for this day.</Text>}
          renderItem={({ item }) => {
            const cu = custOf(item);
            const isFailed = failed(item);
            const open = !item.checkOut && !isFailed;
            const dur = open
              ? running(now - new Date(item.checkIn || 0).getTime())
              : item.checkOut
                ? spent(new Date(item.checkOut).getTime() - new Date(item.checkIn || 0).getTime())
                : '—';
            return (
              <View style={[styles.card, open && { borderColor: '#B8C6E4' }, isFailed && { borderColor: theme.rubyBorder }]}>
                <View style={styles.head}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.custName || cu?.name || 'Customer'}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[repName(item.rep), item.custCity || cu?.city, item.custMobile || cu?.phone]
                        .filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text style={[styles.dur, open && { color: theme.emeraldInk }, isFailed && { color: theme.ruby }]}>
                    {dur}
                  </Text>
                </View>

                <Text style={styles.times}>
                  {at(item.checkIn)} → {item.checkOut
                    ? at(item.checkOut)
                    : isFailed
                      ? <Text style={{ color: theme.ruby, fontWeight: '700' }}>⚠️ check-out failed</Text>
                      : <Text style={{ color: theme.emeraldInk, fontWeight: '700' }}>● in progress</Text>}
                </Text>

                {item.inLat != null && (
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.inLat},${item.inLng}`)}
                  >
                    <Text style={styles.mapTxt}>
                      📍 {item.inSource === 'gps' && item.inAcc != null ? `GPS ±${item.inAcc}m` : 'View on map'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 18, paddingBottom: 60, width: '100%', maxWidth: 620, alignSelf: 'center' },

  liveBar: {
    backgroundColor: theme.emeraldSoft, borderWidth: 1, borderColor: '#B8C6E4',
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  liveTxt: { fontSize: 13.5, fontWeight: '700', color: theme.emeraldInk },

  filterLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: theme.meta, marginTop: 16, marginBottom: 8 },
  chips: { gap: 7, paddingRight: 18 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  chipOn: { backgroundColor: theme.emerald, borderColor: theme.emeraldInk },
  chipTxt: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  chipTxtOn: { color: '#fff', fontWeight: '700' },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  kpi: {
    width: '47.5%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 12,
  },
  kpiLabel: { fontSize: 11.5, fontWeight: '700', color: theme.meta },
  kpiValue: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 3 },
  kpiSub: { fontSize: 11.5, color: theme.meta, marginTop: 2 },

  sec: { fontSize: 13, fontWeight: '800', color: theme.ink, marginTop: 22, marginBottom: 10 },

  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  meta: { fontSize: 12, color: theme.meta, marginTop: 3 },
  dur: { fontSize: 15, fontWeight: '800', color: theme.ink2, fontFamily: 'monospace', flexShrink: 0 },
  times: { fontSize: 12.5, color: theme.meta, marginTop: 8 },
  mapBtn: {
    alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  mapTxt: { fontSize: 12, fontWeight: '700', color: theme.ink2 },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 20, paddingHorizontal: 24 },
  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
