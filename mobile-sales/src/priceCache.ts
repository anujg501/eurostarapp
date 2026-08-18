import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type PriceSnapshot } from './api';

// The generated catalogue is ~700 KB. Fetching it on every category tap is what
// made the browse wizard feel slow: a cold start paid the whole download before
// anything could be drawn.
//
// Three layers, fastest first:
//   1. memory   — free for the rest of the app run
//   2. storage  — survives a restart, so a returning customer waits on nothing
//   3. network  — only on a first ever run, or as a quiet background refresh
const KEY = 'eurostar-price-snapshot-v2'; // v2: catalogue gained shapesByGrade

let MEM: PriceSnapshot | null = null;
let INFLIGHT: Promise<PriceSnapshot> | null = null;
let REFRESHED = false;

/** Pull a fresh copy and write it through to both caches. */
async function fetchAndStore(): Promise<PriceSnapshot> {
  const s = await api.priceSnapshot();
  MEM = s;
  // Storing is best-effort: a full disk should not break browsing.
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  return s;
}

/**
 * The catalogue, as fast as it can be had.
 *
 * A stored copy is returned immediately and refreshed in the background, so
 * prices are never more than one app-run stale while the pad still opens at
 * once. Concurrent callers share one request rather than each starting a
 * download of their own.
 */
export async function getSnapshot(): Promise<PriceSnapshot> {
  if (MEM) return MEM;
  if (INFLIGHT) return INFLIGHT;

  INFLIGHT = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const stored = JSON.parse(raw) as PriceSnapshot;
        MEM = stored;
        // Catch up with the office in the background — the office may have
        // re-published prices since this copy was written.
        if (!REFRESHED) {
          REFRESHED = true;
          fetchAndStore().catch(() => {});
        }
        return stored;
      }
    } catch {
      // A corrupt or unreadable copy is simply replaced by a fresh download.
    }
    REFRESHED = true;
    return fetchAndStore();
  })();

  try {
    return await INFLIGHT;
  } finally {
    INFLIGHT = null;
  }
}

/**
 * Start loading before anybody asks.
 *
 * Called from the home screen, so the catalogue is usually in memory by the
 * time a category is tapped and the pad opens with no wait at all.
 */
export function warmSnapshot(): void {
  if (MEM || INFLIGHT) return;
  getSnapshot().catch(() => {});
}
