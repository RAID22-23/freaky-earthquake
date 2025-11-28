// Simple in-memory TTL cache with optional AsyncStorage persistence for details
import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
};

const map = new Map<string, CacheEntry<any>>();
const PERSIST_KEY = 'MOVIE_APP_CACHE';

export function setCache<T>(key: string, value: T, ttlMs?: number) {
  const expiresAt = typeof ttlMs === 'number' ? Date.now() + ttlMs : null;
  map.set(key, { value, expiresAt });
}

export function getCache<T>(key: string): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    map.delete(key);
    return null;
  }
  return entry.value as T;
}

export function clearCache(key?: string) {
  if (typeof key === 'string') map.delete(key);
  else map.clear();
}

// Persist / hydrate details cache for durability across reloads
async function hydratePersisted() {
  try {
    const json = await AsyncStorage.getItem(PERSIST_KEY);
    if (!json) return;
    const state: { key: string; value: any; expiresAt: number | null }[] = JSON.parse(json);
    state.forEach((s) => map.set(s.key, { value: s.value, expiresAt: s.expiresAt }));
  } catch (e) {
    console.error("Error hydrating persisted cache:", e);
  }
}

async function persist() {
  try {
    const arr: { key: string; value: any; expiresAt: number | null }[] = [];
    for (const [key, entry] of map) {
      if (!key.startsWith('movie:')) continue; // only persist details
      arr.push({ key, value: entry.value, expiresAt: entry.expiresAt ?? null });
    }
    await AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

// init hydrate on import, but only in environments where `window` exists (avoid SSR errors)
if (typeof window !== 'undefined') {
  hydratePersisted();
}

// A smart setter that will persist only movie details to AsyncStorage
export async function setCachePersist<T>(key: string, value: T, ttlMs?: number) {
  setCache(key, value, ttlMs);
  // persist in the background (don't block)
  await persist();
}

export default { getCache, setCache, clearCache, setCachePersist };
