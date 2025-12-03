import { useCallback, useRef, useState, useEffect } from 'react';
import type { Movie } from '../_context/MovieContext';

export type FetchMoviesFn = (query: string, page: number) => Promise<{ results: Movie[]; total_pages: number }>; 

/**
 * Hook: useInfiniteMovies
 * - Handles paginated fetching using a lightweight cache of pages
 * - Keeps a small visible window (visibleStart..visibleEnd) of pages which are rendered
 * - Prefetches surrounding pages (1 page below and above by default) for a smooth UX
 * - Exposes fetchPage, fetchNext, prefetchPage to control fetching and visibility
 *
 * This keeps the list operations straightforward for FlatList and avoids UI jumps by
 * only showing pages when they are explicitly appended (by calling fetchNext / makeVisible).
 */
type HookOptions = { prefetchRadius?: number; maxCachedPages?: number };

export default function useInfiniteMovies(fetchFn: FetchMoviesFn, initialQuery = '', options: HookOptions = {}) {
  const { prefetchRadius = 10, maxCachedPages = 20 } = options;
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Keep a set of pages currently being fetched to avoid duplicates
  const fetchingPagesRef = useRef(new Set<number>());
  // Cache of pages: map page -> movies
  const pagesCacheRef = useRef<Map<number, Movie[]>>(new Map());
  // Visible window: start & end pages (inclusive). start defaults to 1, end == 0 means nothing yet
  const [visibleStart, setVisibleStart] = useState(1);
  const [visibleEnd, setVisibleEnd] = useState(0);
  // A token to ignore stale results when the query changes
  const queryVersionRef = useRef(0);

  const reset = useCallback((newQuery = '') => {
    queryVersionRef.current += 1; // bump to invalidate in-flight
    setQuery(newQuery);
    setItems([]);
    setCurrentPage(1);
    setTotalPages(null);
    fetchingPagesRef.current.clear();
    pagesCacheRef.current.clear();
    setVisibleStart(1);
    setVisibleEnd(0);
  }, []);

  const fetchPage = useCallback(async (page = 1, { makeVisible = false } : { makeVisible?: boolean } = {}) => {
    const v = queryVersionRef.current;
    if (page <= 0) return;
    const shouldFetch = (totalPages == null) || page <= (totalPages ?? Infinity);
    if (!shouldFetch) return;
    if (fetchingPagesRef.current.has(page)) return;
    fetchingPagesRef.current.add(page);
    if (page === 1) setIsLoading(true); else setIsLoadingMore(true);
    let results: Movie[] | undefined = undefined;
    try {
      const resp = await fetchFn(query, page);
      // ensure this response matches our version (no stale query)
      if (v !== queryVersionRef.current) return undefined;
      setTotalPages(resp.total_pages);
      // store page in cache
      pagesCacheRef.current.set(page, resp.results);
      results = resp.results;
      // if requested to be visible, adjust visibleEnd/start accordingly
      if (makeVisible) {
        setVisibleEnd((prev) => Math.max(prev, page));
        setCurrentPage((prev) => Math.max(prev, page));
      }
      return results;
    } finally {
      fetchingPagesRef.current.delete(page);
      if (page === 1) setIsLoading(false); else setIsLoadingMore(false);
    }
  }, [fetchFn, query, totalPages]);

  // fetch next page helper
  const fetchNext = useCallback(() => {
    const next = currentPage + 1;
    if (totalPages != null && next > totalPages) return;
    return fetchPage(next, { makeVisible: true });
  }, [currentPage, totalPages, fetchPage]);

  const prefetchPage = useCallback((page: number) => {
    if (!page || page < 1) return;
    if (pagesCacheRef.current.has(page)) return;
    return fetchPage(page, { makeVisible: false });
  }, [fetchPage]);

  const appendPrevious = useCallback(async (): Promise<number> => {
    const prevPage = visibleStart - 1;
    if (prevPage < 1) return 0;
    if (pagesCacheRef.current.has(prevPage)) {
      const existing = pagesCacheRef.current.get(prevPage) ?? [];
      setVisibleStart(prevPage);
      return existing.length;
    }
    const res = await fetchPage(prevPage, { makeVisible: true }) as Movie[] | undefined;
    setVisibleStart(prevPage);
    return res ? res.length : 0;
  }, [visibleStart, fetchPage]);

  const appendNext = useCallback(async (): Promise<number> => {
    const next = visibleEnd + 1;
    if (totalPages != null && next > totalPages) return 0;
    if (pagesCacheRef.current.has(next)) {
      const existing = pagesCacheRef.current.get(next) ?? [];
      setVisibleEnd(next);
      return existing.length;
    }
    const res = await fetchPage(next, { makeVisible: true }) as Movie[] | undefined;
    setVisibleEnd(next);
    return res ? res.length : 0;
  }, [visibleEnd, fetchPage, totalPages]);

  // reset when query changes externally
  useEffect(() => { reset(initialQuery); }, [initialQuery, reset]);

  // recompute items when visible window or cache changes
  useEffect(() => {
    const start = visibleStart;
    const end = visibleEnd;
    const keys = Array.from(pagesCacheRef.current.keys()).filter((p) => p >= start && p <= end).sort((a,b)=>a-b);
    const result: Movie[] = [];
    keys.forEach((k) => {
      const data = pagesCacheRef.current.get(k);
      if (data) result.push(...data);
    });
    setItems(result);
  }, [visibleStart, visibleEnd]);

  // Keep a small radius of prefetch pages around visible window (configurable)
  useEffect(() => {
    for (let i = 1; i <= prefetchRadius; i++) {
      const prev = visibleStart - i;
      const next = visibleEnd + i;
      if (prev >= 1 && !pagesCacheRef.current.has(prev)) fetchPage(prev, { makeVisible: false }).catch(() => {});
      if (next <= (totalPages ?? Infinity) && !pagesCacheRef.current.has(next)) fetchPage(next, { makeVisible: false }).catch(() => {});
    }
  }, [visibleStart, visibleEnd, totalPages, fetchPage, prefetchRadius]);

  // Prune cache outside a small radius to avoid memory growth: keep only visible +/- prefetchRadius
  useEffect(() => {
    const radius = prefetchRadius;
    const min = Math.max(1, visibleStart - radius);
    const max = Math.min(totalPages ?? Infinity, visibleEnd + radius);
    const keys = Array.from(pagesCacheRef.current.keys());
    for (const k of keys) {
      if (k < min || k > max) pagesCacheRef.current.delete(k);
    }
  }, [visibleStart, visibleEnd, totalPages, prefetchRadius]);

  return {
    items,
    isLoading,
    isLoadingMore,
    currentPage,
    totalPages,
    query,
    setQuery,
    reset,
    fetchPage,
    fetchNext,
    prefetchPage,
    appendNext,
    appendPrevious,
    visibleStart,
    visibleEnd,
  } as const;
}
