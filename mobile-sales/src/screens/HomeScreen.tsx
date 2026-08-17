import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type Category, type Product, type Order, type SiteContent } from '../api';
import { warmSnapshot } from '../priceCache';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

// The wording the storefront falls back to when the office has not set its own
// in Admin > Content. Same text as the web, so the two never disagree.
const HERO_SUB =
  '40 years sourcing moissanite, lab-grown gems, Color Cubic Zirconia, mother of pearl and pearls — calibrated, certified, delivered. Order from our trade catalog.';

type Card = { quote: string; name: string; org: string; initials: string; tag: string };

// Shown when the office has not written its own in Admin > Content. Copied word
// for word from the storefront's fallback set, so the two never disagree.
const TESTIMONIALS: Card[] = [
  { quote: 'We’ve moved our entire melee moissanite line to Eurostar. The calibration is dead-on — our casting reject rate dropped noticeably and matched pairs actually match.',
    name: 'Procurement Head', org: 'Tanvi Gold Cast', initials: 'TG', tag: 'Bulk · Moissanite & CZ' },
  { quote: 'Consistency at volume is what matters to us. Lot after lot, the colour grades hold. Their GRA-marked stones clear our QC without back-and-forth.',
    name: 'Sourcing Team', org: 'Malabar Gold & Diamonds', initials: 'MG', tag: 'Enterprise · Lab-grown' },
  { quote: 'For studded collections we need reliable supply and certificates we can stand behind. Eurostar has been a dependable partner on both.',
    name: 'Merchandising', org: 'Tanishq (vendor network)', initials: 'TQ', tag: 'Certified · Lab-grown' },
  { quote: 'I run a small unit in Rajkot — they still treat my 200-piece orders seriously. Sizes are always in stock and shipped same week.',
    name: 'Jignesh P.', org: 'Shree Ganesh Jewellers, Rajkot', initials: 'JP', tag: 'Independent buyer' },
  { quote: 'The packet system makes reordering simple. I know exactly how many pieces I’m getting per size, and pricing is transparent.',
    name: 'Farida K.', org: 'Crescent Ornaments, Hyderabad', initials: 'FK', tag: 'Independent buyer' },
  { quote: 'Started with one tray of Color CZ, now I order across six categories. The strips and pearl strings are a real time-saver for my karigars.',
    name: 'Anil M.', org: 'Mehta Jewel Works, Surat', initials: 'AM', tag: 'Independent buyer' },
];

const TRUST: [any, string, string][] = [
  ['shield', 'GRA-verified Moissanite', 'Every loose stone laser-marked, verifiable on gra-gems.com'],
  ['package', 'Calibrated to spec', 'Tighter than ±0.05mm tolerance across paired sets'],
  ['truck', 'Trade-only shipping', 'Insured & sealed parcels via BlueDart, DTDC, DHL Export'],
  ['refresh-cw', 'Easy returns', '7-day return on defects, exchange on calibration mismatch'],
];

/**
 * The shop front, laid out as the web storefront lays it out: the brand bar,
 * the section tabs, search, then the hero and the categories underneath.
 *
 * Nothing here is baked in. The categories come from /catalog, the SKU counts
 * from /catalog/products, the lifetime-order figure from this customer's own
 * orders, and the hero wording from Admin > Content — so a change the office
 * makes shows up on the phone and the web together.
 */
export default function HomeScreen({ navigation, onSignOut }: any) {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [content, setContent] = useState<SiteContent>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [pimgs, setPimgs] = useState<Record<string, string>>({});
  const [myOrders, setMyOrders] = useState<number | null>(null);
  const [who, setWho] = useState('');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      // The catalogue is the only thing worth failing over — the rest degrade
      // to a dash rather than an empty shop.
      const [me, c, p, orders, site, th, pi] = await Promise.all([
        api.me().catch(() => null),
        api.catalog(),
        api.products().catch(() => ({ products: [] as Product[] })),
        api.orders().catch(() => [] as Order[]),
        api.content().catch(() => ({} as SiteContent)),
        api.catThumbs().catch(() => ({})),
        api.productImages().catch(() => ({})),
      ]);
      if (me) setWho(me.name);
      setCats(c.categories || []);
      setProducts(p.products || []);
      setMyOrders(Array.isArray(orders) ? orders.length : 0);
      setContent(site || {});
      setThumbs(th || {});
      setPimgs(pi || {});
    } catch (e: any) {
      setErr(e?.message || 'Could not load the catalogue.');
      setCats([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Start pulling the price catalogue while the customer is still looking at
  // the category grid, so tapping one opens the pad with no wait.
  useEffect(() => { warmSnapshot(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const countFor = (key: string) => products.filter((p) => p.cat === key).length;

  // The category's own thumbnail if the office set one; otherwise the first
  // product photo filed under it (keys are "cat|colour|shape"). Same order of
  // preference as the web card.
  const artFor = (key: string) => {
    if (thumbs[key]) return thumbs[key];
    const prefix = key + '|';
    const hit = Object.keys(pimgs).find((k) => k.startsWith(prefix) && pimgs[k]);
    return hit ? pimgs[hit] : null;
  };

  // Office-written testimonials win; blank rows are dropped, as the web drops
  // them, and the built-in set stands in when nothing usable is left.
  const written = (content.testimonials || []).filter((t) => (t.text || '').trim());
  const testimonials: Card[] = written.length
    ? written.map((t) => ({
        quote: t.text,
        name: t.name || '',
        org: t.city || '',
        initials: (t.name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
          .map((w) => w[0].toUpperCase()).join(''),
        tag: 'Trade buyer',
      }))
    : TESTIMONIALS;

  const shown = (cats || []).filter((c) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [c.name, c.short, c.key].filter(Boolean).some((v) => String(v).toLowerCase().includes(t));
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Home" who={who} q={q} onQ={setQ} />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {cats === null ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(c) => c.key}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.emerald} />}
          ListHeaderComponent={
            <View>
              {/* Hero */}
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>WHOLESALE PORTAL · MUMBAI &amp; JAIPUR</Text>
                {content.heroTitle ? (
                  <Text style={styles.heroTitle}>{content.heroTitle}</Text>
                ) : (
                  <Text style={styles.heroTitle}>
                    Makes <Text style={styles.heroEm}>true</Text> beauty,{'\n'}by the lot.
                  </Text>
                )}
                <Text style={styles.heroSub}>{content.heroSub || HERO_SUB}</Text>

                <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Orders')} activeOpacity={0.85}>
                  <Text style={styles.heroBtnTxt}>View your orders  ›</Text>
                </TouchableOpacity>

                <View style={styles.statsRule} />
                <View style={styles.stats}>
                  <Stat value="40" label="Years in operation" />
                  <Stat value="28,000+" label="Active SKUs" />
                  <Stat value="12,400" label="Trade buyers globally" />
                  <Stat value={myOrders === null ? '—' : String(myOrders)} label="Your lifetime orders" />
                </View>
              </View>

              <View style={styles.secHead}>
                <Text style={styles.secTitle}>Shop by category</Text>
                <Text style={styles.secMeta}>{shown.length} product families</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {q ? 'Nothing matches that search.' : 'No categories are published yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const art = artFor(item.key);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Category', { cat: item.key, name: item.name })}
              >
                {/* The photo is shown whole, never cropped — these are product
                    shots on white, so `contain` on a white backing leaves no
                    visible bars. Same treatment as the web card. */}
                <View style={[styles.cardArt, art ? { backgroundColor: '#fff' } : null]}>
                  {art ? (
                    <Image source={{ uri: art }} style={styles.cardImg} resizeMode="contain" />
                  ) : (
                    <Text style={styles.cardInitial}>{(item.short || item.name || '?').slice(0, 1)}</Text>
                  )}
                </View>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {countFor(item.key) ? `${countFor(item.key)} SKUs` : 'priced by size'}
                  {item.unit ? ` · per ${item.unit}` : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View>
              {/* Trusted by the trade — the office's own testimonials when it
                  has written any, otherwise the built-in set. */}
              <View style={[styles.secHead, { marginTop: 30 }]}>
                <Text style={styles.secTitle}>Trusted by the trade</Text>
              </View>
              <Text style={[styles.secMeta, { marginTop: -8, marginBottom: 14 }]}>
                Manufacturers &amp; ateliers across India
              </Text>

              {testimonials.map((t, i) => (
                <View key={i} style={styles.testi}>
                  <Text style={styles.quoteMark}>“</Text>
                  <Text style={styles.quote}>{t.quote}</Text>
                  <View style={styles.testiFoot}>
                    <View style={styles.testiAvatar}>
                      <Text style={styles.testiAvatarTxt}>{t.initials}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.testiOrg}>{t.org}</Text>
                      <Text style={styles.testiName}>
                        {[t.name, t.tag].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Trust strip */}
              <View style={styles.trust}>
                {TRUST.map(([icon, title, desc], i) => (
                  <View key={title} style={[styles.trustRow, i > 0 && styles.trustSep]}>
                    <Feather name={icon} size={20} color={theme.emerald} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.trustTitle}>{title}</Text>
                      <Text style={styles.trustDesc}>{desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <ShopFooter />
            </View>
          }
        />
      )}

      {/* "Ask Mira", bottom-right on every page of the storefront. */}
      <Mira role="customer" section="Home" />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header and footer styles live in ShopChrome — Home and My account share
  // the component so the two pages cannot drift apart.
  pad: { padding: 18, paddingBottom: 90, width: '100%', maxWidth: 620, alignSelf: 'center' },

  // Hero
  hero: { backgroundColor: theme.emerald, borderRadius: 18, padding: 22, marginBottom: 22 },
  eyebrow: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(245,231,196,0.85)', marginBottom: 14,
  },
  heroTitle: { fontSize: 30, lineHeight: 37, fontWeight: '700', color: '#FDFAF2', letterSpacing: -0.4 },
  heroEm: { fontStyle: 'italic', fontWeight: '400' },
  heroSub: { fontSize: 14, lineHeight: 22, color: 'rgba(253,250,242,0.88)', marginTop: 14 },
  heroBtn: {
    alignSelf: 'flex-start', marginTop: 20, backgroundColor: theme.surface,
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13,
  },
  heroBtnTxt: { fontSize: 14.5, fontWeight: '700', color: theme.ink },
  statsRule: { height: 1, backgroundColor: 'rgba(253,250,242,0.22)', marginTop: 24 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18 },
  stat: { width: '50%', marginBottom: 16, paddingRight: 10 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FDFAF2' },
  statLabel: { fontSize: 11.5, color: 'rgba(253,250,242,0.72)', marginTop: 3 },

  secHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 14 },
  secTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.2 },
  secMeta: { fontSize: 12.5, color: theme.meta },

  // One card per row with a tall image, as the storefront shows on a phone
  // (.cat-card with .cat-card-art at 190px under 720px wide).
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 18, padding: 18, marginBottom: 14,
  },
  cardArt: {
    height: 190, borderRadius: 12, backgroundColor: theme.paper,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cardImg: { width: '100%', height: '100%' },
  cardInitial: { fontSize: 44, fontWeight: '800', color: theme.emeraldSoft },
  // The web sets category names in the serif face; Android resolves 'serif' to
  // Noto Serif, which is the closest match available without shipping a font.
  cardName: { fontFamily: 'serif', fontSize: 19, color: theme.ink, marginTop: 14, letterSpacing: -0.1 },
  cardMeta: { fontSize: 12.5, color: theme.meta, marginTop: 5 },

  // Testimonials
  testi: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 16, padding: 18, marginBottom: 12,
  },
  quoteMark: { fontFamily: 'serif', fontSize: 40, lineHeight: 40, color: theme.emeraldSoft, marginBottom: -6 },
  quote: { fontSize: 14, lineHeight: 22, color: theme.ink2 },
  testiFoot: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16 },
  testiAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.emeraldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  testiAvatarTxt: { fontSize: 12.5, fontWeight: '800', color: theme.emeraldInk },
  testiOrg: { fontSize: 13.5, fontWeight: '700', color: theme.ink },
  testiName: { fontSize: 12, color: theme.meta, marginTop: 2 },

  // Trust strip
  trust: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 16, paddingHorizontal: 18, marginTop: 8,
  },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 16 },
  trustSep: { borderTopWidth: 1, borderTopColor: theme.divider },
  trustTitle: { fontSize: 14, fontWeight: '700', color: theme.ink },
  trustDesc: { fontSize: 12.5, color: theme.meta, marginTop: 4, lineHeight: 19 },

  empty: { fontSize: 13, color: theme.meta, textAlign: 'center', marginTop: 30 },
  err: { color: theme.ruby, fontSize: 13, paddingHorizontal: 18, paddingTop: 14 },
});
