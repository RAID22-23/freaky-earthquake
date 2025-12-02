import axios from 'axios';
import { Image } from 'react-native';
import { setCachePersist, getCache, setCache } from './cache';
import { EXPO_PUBLIC_API_KEY } from './config';

const BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchMovies(query = '', page = 1) {
  const key = `movies:${query}:${page}`;
  const cached = getCache<any>(key);
  if (cached) return cached;
  if (!EXPO_PUBLIC_API_KEY) throw new Error('API key missing');
  const endpoint = query
    ? `${BASE_URL}/search/movie?api_key=${EXPO_PUBLIC_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    : `${BASE_URL}/movie/popular?api_key=${EXPO_PUBLIC_API_KEY}&page=${page}`;
  const resp = await axios.get(endpoint);
  // cache results for 2 minutes (short-lived)
  setCache(key, resp.data, 1000 * 60 * 2);
  return resp.data;
}

export async function fetchMovieDetails(id: string | number, { ttlMs = 1000 * 60 * 60 } = {}) {
  const key = `movie:${id}`;
  const cached = getCache<any>(key);
  if (cached) return cached;
  if (!EXPO_PUBLIC_API_KEY) throw new Error('API key missing');
  const resp = await axios.get(`${BASE_URL}/movie/${id}?api_key=${EXPO_PUBLIC_API_KEY}`);
  // cache details (persisted) default ttl 60 minutes
  await setCachePersist(key, resp.data, ttlMs);
  // Prefetch poster / backdrop for better UX
  try {
    const poster = resp.data.poster_path ? `https://image.tmdb.org/t/p/w500${resp.data.poster_path}` : null;
    const backdrop = resp.data.backdrop_path ? `https://image.tmdb.org/t/p/w500${resp.data.backdrop_path}` : null;
    if (poster) Image.prefetch(poster);
    if (backdrop) Image.prefetch(backdrop);
  } catch (e) {
    console.error("Error prefetching images:", e);
    // ignore
  }
  return resp.data;
}

export async function prefetchMovieDetails(ids: (string | number)[]) {
  const safe = ids.filter(Boolean).slice(0, 10);
  await Promise.all(safe.map(async (id) => {
    const key = `movie:${id}`;
    if (getCache(key)) return;
    try { await fetchMovieDetails(id); } catch (e) { console.error(`Error prefetching movie ${id}:`, e); }
  }));
}

export async function prefetchMovies(query = '', page = 1) {
  const key = `movies:${query}:${page}`;
  if (getCache(key)) return;
  try { await fetchMovies(query, page); } catch (e) { console.error(`Error prefetching movies ${query} page ${page}:`, e); }
}

export default { fetchMovies, fetchMovieDetails, prefetchMovieDetails, prefetchMovies };
