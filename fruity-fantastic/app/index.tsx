import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, TextInput, FlatList, ActivityIndicator, StyleSheet, Alert, SafeAreaView, useWindowDimensions, Image, Platform, AppState, Animated } from 'react-native';
import { Shadow } from './_utils/styles';
import { incrementRenderCount, getRenderCount, useRenderCounter } from './_utils/renderCounter';
import AppButton from './_components/AppButton';
import { useToast } from './_context/ToastContext';
import { useRouter } from 'expo-router';
import FilterBar from './_components/FilterBar';
import { fetchMovies as apiFetchMovies, prefetchMovies as apiPrefetchMovies, prefetchMovieDetails as apiPrefetchMovieDetails } from './_utils/api';
import MovieCard from './_components/MovieCard';
import { useMovieContext } from './_context/MovieContext';
import NavBar from './_components/NavBar';
import type { Movie } from './_context/MovieContext';
import { useTheme } from './_context/ThemeProvider';
import { getNumColumns, calcCardWidth } from './_utils/layout';


export default function Index() {
  useRenderCounter('Index');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = getNumColumns(width);
  const cardWidth = calcCardWidth(width, numColumns);
  const { colors, sizing, fonts } = useTheme();
  const toast = useToast();
  const { favourites, addFavourite, removeFavourite } = useMovieContext();

  // Prepare stable references and maps to prevent handler identity churn and unnecessary re-renders
  const favouritesSet = React.useMemo(() => new Set(favourites.map((m) => m.id)), [favourites]);
  const addRef = useRef(addFavourite);
  const removeRef = useRef(removeFavourite);
  const favSetRef = useRef(favouritesSet);
  const moviesMapRef = useRef<Map<number, Movie>>(new Map());
  const toggleHandlersRef = useRef<Map<number, () => void>>(new Map());

  useEffect(() => { addRef.current = addFavourite; removeRef.current = removeFavourite; }, [addFavourite, removeFavourite]);
  useEffect(() => { favSetRef.current = favouritesSet; }, [favouritesSet]);
  useEffect(() => { const map = moviesMapRef.current; map.clear(); movies.forEach((m) => map.set(m.id, m)); }, [movies]);

  const getToggleHandler = useCallback((id: number) => {
    const map = toggleHandlersRef.current;
    let fn = map.get(id);
    if (fn) return fn;
    fn = () => {
      const isFavNow = favSetRef.current.has(id);
      if (isFavNow) removeRef.current(id);
      else {
        const movie = moviesMapRef.current.get(id);
        if (movie) addRef.current(movie);
      }
    };
    map.set(id, fn);
    return fn;
  }, []);

  // Guards and caches
  // NOTE: This file implements a robust, per-query page-fetch lifecycle. Key ideas:
  // - loadedPagesRef holds pages already loaded per query (prevents duplicate network calls)
  // - fetchingPagesRef holds pages currently in-flight per query (prevents duplicate/concurrent calls)
  // - pendingPageResultsRef buffers page>1 results and commits them in order for smoother rendering
  // - suppressViewabilityRef prevents prefetch triggers from programmatic scrolls
  // This aims to avoid race conditions where out-of-order responses or programmatic scrolling cause re-fetch loops
  const prefetchPagesMapRef = useRef<Map<string, Set<number>>>(new Map());
  const loadedPagesRef = useRef<Map<string, Set<number>>>(new Map());
  // Track pages currently being fetched per query (to avoid duplicates & race conditions)
  const fetchingPagesRef = useRef<Map<string, Set<number>>>(new Map());
  const lastVisibleIdsRef = useRef<number[]>([]);
  const lastVisibleIndexRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const listRef = useRef<any>(null);
  const pendingPageResultsRef = useRef<Map<string, Map<number, Movie[]>>>(new Map());
  const pendingCommitTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // track last append to suppress immediate scroll restore and logs
  const lastAppendRef = useRef<{ time: number; pages: number[] }>({ time: 0, pages: [] });
  const lastEndReachedRef = useRef<number>(0);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const suppressViewabilityRef = useRef(false);

  // Prefetch movies for a page (idempotent, only caches)
  const prefetchNextPage = useCallback((page: number, q?: string) => {
    if (!page) return;
    const queryToCheck = (q ?? activeQuery) ?? '';
    const currentTotalPages = queryToCheck === activeQuery ? totalPages : Infinity;
    if (page > currentTotalPages) return;
    const qKey = (q ?? activeQuery) ?? '';
    const setPages = prefetchPagesMapRef.current.get(qKey) ?? new Set<number>();
    if (setPages.has(page)) return;
    setPages.add(page);
    prefetchPagesMapRef.current.set(qKey, setPages);
    apiPrefetchMovies(q ?? activeQuery, page).catch(() => {});
    if (__DEV__) console.debug('[prefetchNextPage] scheduled', qKey, page);
  }, [activeQuery, totalPages]);

  // fetch movies with dedupe and loaded-page checks
  const fetchMovies = useCallback(async (query = '', page = 1) => {
    const qKey = query ?? '';
    const loadedSet = loadedPagesRef.current.get(qKey) ?? new Set<number>();
    const fetchingSet = fetchingPagesRef.current.get(qKey) ?? new Set<number>();
    // don't re-fetch a page that's already loaded / fetching
    if (loadedSet.has(page) || fetchingSet.has(page)) {
      if (__DEV__) console.debug('[fetchMovies] already loaded OR fetching', qKey, page, 'moviesLen', movies.length, 'pendingPages', Array.from((pendingPageResultsRef.current.get(qKey) ?? new Map()).keys()));
      // ensure currentPage reflects that for active query
      if (qKey === activeQuery) setCurrentPage((p) => Math.max(p, page));
      return;
    }
    // mark page as fetching
    fetchingSet.add(page);
    fetchingPagesRef.current.set(qKey, fetchingSet);
    if (__DEV__) console.debug('[fetchMovies] starting fetch', qKey, page, 'fetchingCount', fetchingSet.size);
    if (page > 1) setLoadingMore(true); else setLoading(true);
    try {
      const response = await apiFetchMovies(query, page);
      if (page > 1) {
        // Buffer results and batch commit for smoother updates
        const qKey = query ?? '';
        const mapForQuery = pendingPageResultsRef.current.get(qKey) ?? new Map<number, Movie[]>();
        mapForQuery.set(page, response.results);
        pendingPageResultsRef.current.set(qKey, mapForQuery);
        // schedule commit shortly if not already scheduled
        if (!pendingCommitTimersRef.current.get(qKey)) {
          const timer = setTimeout(() => {
            const pagesMap = pendingPageResultsRef.current.get(qKey);
            if (!pagesMap) return;
            const loadedSet = loadedPagesRef.current.get(qKey) ?? new Set<number>();
            // Sort pages to append in order
            const pagesNums = Array.from(pagesMap.keys()).sort((a, b) => a - b);
            let appendedPages: number[] = [];
            let append: Movie[] = [];
            // Append results using functional setMovies so we always compute existing items from the latest state
            pagesNums.forEach((p) => {
              if (!loadedSet.has(p)) {
                const results = pagesMap.get(p) ?? [];
                append = [...append, ...results];
                appendedPages.push(p);
              }
            });
            if (append.length > 0 && qKey === activeQuery) {
              if (__DEV__) console.debug('[commit] appending pages', pagesNums, 'append', append.length);
              // record recent append so UI doesn't try to restore scroll immediately and cause a jump
              lastAppendRef.current = { time: Date.now(), pages: appendedPages };
              setMovies((prev) => {
                const existing = new Set(prev.map((m) => m.id));
                const filtered = append.filter((r) => !existing.has(r.id));
                return [...prev, ...filtered];
              });
              if (appendedPages.length) {
                const lastAppended = appendedPages[appendedPages.length - 1];
                setCurrentPage((p) => Math.max(p, lastAppended));
                // mark loaded only for pages we've appended
                appendedPages.forEach((p) => loadedSet.add(p));
              }
              // clear append marker after a small grace period to allow the restore effect to skip
              setTimeout(() => { lastAppendRef.current = { time: 0, pages: [] }; }, 1200);
            }
            // mark loaded and clear buffer
            loadedPagesRef.current.set(qKey, loadedSet);
            pendingPageResultsRef.current.delete(qKey);
            pendingCommitTimersRef.current.delete(qKey);
          }, 300); // batch more pages to avoid repeated re-renders and reduce jank
          pendingCommitTimersRef.current.set(qKey, timer as any);
        }
      } else {
        // Only update the visible list if this request matches the active query; otherwise cache it silently
        if (qKey === activeQuery) {
          setMovies(response.results);
          // make sure base page is recorded
          setCurrentPage(1);
        }
      }
      setTotalPages(response.total_pages);
      // mark as loaded only for page 1 (replace) — for page > 1 we will mark once we append the results
      if (page === 1) {
        const setPages = loadedPagesRef.current.get(qKey) ?? new Set<number>();
        setPages.add(page);
        loadedPagesRef.current.set(qKey, setPages);
      }
      // prefetch next page
      if (response.total_pages && response.total_pages > page) {
        prefetchNextPage(page + 1);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.showToast('There was a problem fetching movies', 'error');
      Alert.alert('Network error', 'There was a problem fetching movies. Retry?', [
        { text: 'Retry', onPress: () => fetchMovies(query, page) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      if (page > 1) setLoadingMore(false); else setLoading(false);
      const s = fetchingPagesRef.current.get(qKey);
      if (s) { s.delete(page); if (s.size === 0) fetchingPagesRef.current.delete(qKey); }
      if (__DEV__) console.debug('[fetchMovies] finished fetch', qKey, page);
    }
  }, [toast, prefetchNextPage, movies, activeQuery]);

  // trigger fetch when active page changes - but avoid unnecessary duplicate fetches
  useEffect(() => {
    fetchMovies(activeQuery, currentPage);
  }, [activeQuery, currentPage, fetchMovies]);

  // Reset loaded pages for a new search
  const handleSearch = async () => {
    // soft-search: fetch new results first and only replace the shown list once fully loaded
    if (!searchQuery) {
      setActiveQuery('');
      setCurrentPage(1);
      setMovies([]);
      return;
    }
    setIsSearchPending(true);
    try {
      const response = await apiFetchMovies(searchQuery, 1);
      // Replace the list only once results are available
      setMovies(response.results);
      setActiveQuery(searchQuery);
      setCurrentPage(1);
      setTotalPages(response.total_pages);
      // clear append marker (this is a replace, not append)
      lastAppendRef.current = { time: 0, pages: [] };
      // reset loaded pages/write cache
      const s = new Set<number>(); s.add(1); loadedPagesRef.current.set(searchQuery ?? '', s);
      // reset prefetch and pending structures for this query to avoid mixing results
      prefetchPagesMapRef.current.set(searchQuery ?? '', new Set<number>());
      pendingPageResultsRef.current.delete(searchQuery ?? '');
      const oldTimer = pendingCommitTimersRef.current.get(searchQuery ?? '');
      if (oldTimer) { clearTimeout(oldTimer); pendingCommitTimersRef.current.delete(searchQuery ?? ''); }
      // clear any pending page results or timers for this query
      pendingPageResultsRef.current.delete(searchQuery ?? '');
      const t = pendingCommitTimersRef.current.get(searchQuery ?? '');
      if (t) { clearTimeout(t); pendingCommitTimersRef.current.delete(searchQuery ?? ''); }
      prefetchNextPage(2, searchQuery);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearchPending(false);
    }
    return;
  };

  const handleEndReached = useCallback(() => {
    // Do not request if it is already being fetched
    const qKey = activeQuery ?? '';
    const nextPage = currentPage + 1;
    const fetchingSet = fetchingPagesRef.current.get(qKey) ?? new Set<number>();
    if (fetchingSet.has(nextPage)) return;
    // throttle repeated calls
    const now = Date.now();
    if (now - (lastEndReachedRef.current ?? 0) < 600) return;
    lastEndReachedRef.current = now;
    if (nextPage > totalPages) return;
    // directly trigger fetch of next page and then update currentPage
    if (__DEV__) console.debug('[handleEndReached] requesting page', nextPage, 'current', currentPage, 'total', totalPages, 'moviesLen', movies.length, 'filteredLen', filteredMovies.length);
    fetchMovies(activeQuery, nextPage).then(() => { setCurrentPage((p) => Math.max(p, nextPage)); }).catch(() => { /* ignore */ });
  }, [currentPage, totalPages, fetchMovies, activeQuery]);

  const viewabilityConfig = { minimumViewTime: 300, itemVisiblePercentThreshold: 70, waitForInteraction: false };
  const lastViewableRef = useRef<number>(0);
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;
    const ids = viewableItems.map((v: any) => v.item?.id).filter(Boolean);
    // Save visible ids to allow prefetch on focus
    lastVisibleIdsRef.current = ids;
    // Save the smallest index (topmost visible item) so we can restore after data updates
    const indices = viewableItems.map((v: any) => v.index).filter((i: any) => typeof i === 'number');
    const topIndex = Math.min(...indices);
    const now = Date.now();
    // Only update lastVisibleIndexRef if a short time has passed to avoid jitter
    if (now - lastViewableRef.current > 250) {
      lastViewableRef.current = now;
      lastVisibleIndexRef.current = indices.length ? Math.min(...indices) : null;
    }
    // prefetch details for visible items
    apiPrefetchMovieDetails(ids).catch(() => {});
    // prefetch next page if near the end
    const lastVisible = viewableItems[viewableItems.length - 1];
    if (!lastVisible) return;
    const lastIndex = lastVisible.index ?? 0;
    if (__DEV__) console.debug('[onViewableItemsChanged] topId', ids[0], 'topIndex', topIndex, 'lastIndex', lastIndex, 'visibleCount', viewableItems.length);
    // Use filtered movies length (actual list being rendered) when calculating proximity
    if (!suppressViewabilityRef.current && (filteredMoviesRef.current.length - lastIndex) <= (numColumns * 3)) {
      // ensure we don't start duplicate fetches
      const qKey = activeQuery ?? '';
      const next = currentPage + 1;
      const fetchingSet = fetchingPagesRef.current.get(qKey) ?? new Set<number>();
      if (!fetchingSet.has(next) && next <= totalPages) prefetchNextPage(next);
    }
    // prefetch visible posters
    try {
      viewableItems.forEach((v: any) => {
        const m = v?.item;
        if (!m) return;
        if (m.poster_path) Image.prefetch(`https://image.tmdb.org/t/p/w500${m.poster_path}`);
      });
    } catch { }
  }, [prefetchNextPage, currentPage, numColumns, totalPages, activeQuery]);

  // When window or app regains focus, prefetch visible details & next page
  useEffect(() => {
    const doPrefetchOnFocus = () => {
      if (lastVisibleIdsRef.current && lastVisibleIdsRef.current.length > 0) {
        apiPrefetchMovieDetails(lastVisibleIdsRef.current).catch(() => {});
      }
      prefetchNextPage(currentPage + 1);
    };
    // web window focus
    if (Platform.OS === 'web') {
      window.addEventListener('focus', doPrefetchOnFocus);
      return () => window.removeEventListener('focus', doPrefetchOnFocus);
    }
    // mobile AppState
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') doPrefetchOnFocus();
    });
      return () => sub.remove();
  }, [currentPage, prefetchNextPage]);

  // Stable navigation handler for movie cards to avoid inline function recreation
  const navigateToMovie = useCallback((id?: number) => {
    if (!id) return;
    router.push({ pathname: '/movie/[id]', params: { id: String(id) } });
  }, [router]);

  // Memoized renderItem to avoid re-rendering the whole list when unrelated state changes
  const renderMovieItem = useCallback(({ item, index, onMeasure }: { item: Movie; index?: number; onMeasure?: (h: number) => void }) => {
    if (__DEV__) {
      console.debug('[renderMovieItem] rendering', item.id, item.title);
      incrementRenderCount(`Movie-${item.id}`);
      incrementRenderCount('MovieAll');
    }
    const isFav = favSetRef.current.has(item.id);
    const toggle = getToggleHandler(item.id);
    return <MovieCard movie={item} cardWidth={cardWidth} onPress={navigateToMovie} isFavourite={isFav} onToggleFavourite={toggle} onMeasure={onMeasure} />;
  }, [cardWidth, navigateToMovie, getToggleHandler]);
  const [measuredItemHeight, setMeasuredItemHeight] = useState<number | null>(null);
  const measuredForWidthRef = useRef<number | null>(null);

  

  // Avoid creating an inline renderItem in the FlatList which causes rerenders; memoize it.
  const renderListItem = useCallback((props: any) => {
    const { item } = props as any;
    if (item && item.__skeleton) {
      return <MovieCard loading cardWidth={cardWidth} />;
    }
    const index = (props.index as number) ?? 0;
    const shouldMeasure = index === 0 && (!measuredItemHeight || measuredForWidthRef.current !== cardWidth);
    const onMeasure = shouldMeasure ? ((h: number) => {
      const minAccept = Math.max(80, Math.round(computedItemHeight * 0.5));
      if (h && h >= minAccept && (!measuredItemHeight || measuredForWidthRef.current !== cardWidth)) {
        measuredForWidthRef.current = cardWidth;
        setMeasuredItemHeight(h);
        if (__DEV__) console.debug('[measure] measured item height', h, 'for width', cardWidth);
      } else if (__DEV__) {
        console.debug('[measure] ignored measurement', h, 'minAccept', minAccept, 'width', cardWidth);
      }
    }) : undefined;
    return renderMovieItem({ item, index, onMeasure });
  }, [renderMovieItem, cardWidth, measuredItemHeight, navigateToMovie]);

  // Compute vertical margins and provide getItemLayout for constant-height rows to help VirtualizedList and avoid jumps.
  const cardVerticalMargin = Math.round(sizing.gutter * 0.6); // matches MovieCard marginVertical
  const posterHeight = Math.round(cardWidth * 1.4);
  const infoPadding = Math.round(sizing.gutter * 0.75) * 2;
  const titleHeight = Math.round(fonts.md);
  const dateHeight = Math.round(fonts.sm);
  const actionMin = Math.round(Math.max(36, sizing.gutter * 3));
  const computedItemHeight = posterHeight + (cardVerticalMargin * 2) + infoPadding + titleHeight + dateHeight + actionMin + Math.round(sizing.gutter * 0.5);
  const itemHeight = measuredItemHeight ?? computedItemHeight;
  const getItemLayout = useCallback((data: any, index: number) => {
    const row = Math.floor(index / numColumns);
    return { length: itemHeight, offset: itemHeight * row, index };
  }, [itemHeight, numColumns]);

  // Reset measurement if width/columns change so we re-measure with the new width
  useEffect(() => {
    if (measuredForWidthRef.current !== cardWidth) {
      measuredForWidthRef.current = null;
      setMeasuredItemHeight(null);
    }
  }, [cardWidth, numColumns]);

  const isWeb = Platform.OS === 'web';
  const listOpacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // subtle fade when searching to avoid abrupt swap
    Animated.timing(listOpacity, { toValue: isSearchPending ? 0.45 : 1, duration: 220, useNativeDriver: true }).start();
  }, [isSearchPending, listOpacity]);

  const filteredMovies = React.useMemo(() => movies.filter((m) => (m.vote_average ?? 0) >= minRating), [movies, minRating]);
  // keep a stable ref for filtered list for callback access without recreating handlers
  const filteredMoviesRef = useRef(filteredMovies);
  useEffect(() => { filteredMoviesRef.current = filteredMovies; }, [filteredMovies]);

  // Debug changes in movies/filteredMovies length
  useEffect(() => {
    if (__DEV__) console.debug('[moviesState] moviesLen', movies.length, 'filteredLen', filteredMovies.length);
  }, [movies.length, filteredMovies.length]);
  // (we rely on a stable but updated callback for viewability, so refs for currentPage/numColumns are not needed)

  // Restore scroll position if the list updates and we had a stable visible item before change
  useEffect(() => {
    if (!listRef.current) return;
    // If the user is interacting (scrolling) do not adjust scroll position
    if (isInteractingRef.current) return;
    // If we recently appended items to the end, skip restoring scroll to avoid jank
    const lastAppend = lastAppendRef.current;
    if (lastAppend.time && Date.now() - lastAppend.time < 1000) {
      if (__DEV__) console.debug('[restore] skipping restore because recent append', lastAppend.pages);
      return;
    }
    const prevTopId = lastVisibleIdsRef.current?.[0];
    const prevTopIndex = lastVisibleIndexRef.current;
    if (__DEV__) console.debug('[restore] prevTopId', prevTopId, 'prevTopIndex', prevTopIndex, 'filteredLen', filteredMovies.length, 'moviesLen', movies.length);
    if (prevTopId != null) {
      const newIndex = filteredMovies.findIndex((m) => m.id === prevTopId);
      if (__DEV__) console.debug('[restore] newIndex', newIndex);
      if (newIndex >= 0 && newIndex !== prevTopIndex) {
        // Scroll to the new index so the same item stays visible. Suppress viewability triggers
        try { suppressViewabilityRef.current = true; listRef.current?.scrollToIndex({ index: newIndex, animated: false }); setTimeout(() => { suppressViewabilityRef.current = false; }, 300); } catch { suppressViewabilityRef.current = false; }
      } else if (newIndex < 0 && prevTopIndex != null) {
        // If previous top ID no longer exists, keep the same index (clamped)
        const newIdx = Math.min(prevTopIndex, Math.max(0, filteredMovies.length - 1));
        try { listRef.current?.scrollToIndex({ index: newIdx, animated: false }); } catch { }
      }
    } else if (prevTopIndex != null) {
      const idx = Math.min(prevTopIndex, Math.max(0, filteredMovies.length - 1));
      try { suppressViewabilityRef.current = true; listRef.current?.scrollToIndex({ index: idx, animated: false }); setTimeout(() => { suppressViewabilityRef.current = false; }, 300); } catch { suppressViewabilityRef.current = false; }
    }
  }, [filteredMovies]);

  // Watchdog: if we're near the end, not actively fetching, and not currently interacting, try to load next page
  useEffect(() => {
    const id = setInterval(() => {
      if (!listRef.current) return;
      if (isInteractingRef.current) return;
      const qKey = activeQuery ?? '';
      const fetchingSet = fetchingPagesRef.current.get(qKey) ?? new Set<number>();
      if (fetchingSet.size > 0) return;
      if (currentPage >= totalPages) return;
      const lastIndex = lastVisibleIndexRef.current ?? 0;
      if ((filteredMovies.length - lastIndex) <= (numColumns * 3)) {
        if (__DEV__) console.debug('[watchdog] near end, requesting next page', currentPage + 1);
        handleEndReached();
      }
    }, 2500);
    return () => clearInterval(id);
  }, [currentPage, totalPages, filteredMovies.length, numColumns, handleEndReached]);

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
      <NavBar />
      <Text style={[styles.title, { color: colors.text, fontSize: fonts.xxl, marginBottom: sizing.gutter }]}>Movie App</Text>
      <View style={[styles.searchRow, { marginBottom: sizing.gutter }] }>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for movies..."
          style={[styles.searchInput, { padding: Math.round(sizing.gutter * 0.6), borderRadius: Math.round(sizing.radius / 1.2), backgroundColor: colors.card, marginRight: Math.round(sizing.gutter * 0.6) } ]}
        />
        <AppButton variant="primary" onPress={handleSearch} style={{ paddingHorizontal: Math.round(sizing.gutter * 1.1), paddingVertical: Math.round(sizing.gutter * 0.6) }}>
          Search
        </AppButton>
      </View>
      {loading && <ActivityIndicator size="large" style={{ marginVertical: sizing.gutter }} />}
      <View style={{ paddingHorizontal: sizing.gutter }}>
        <FilterBar value={minRating} onChange={setMinRating} />
      </View>
      <Animated.View style={{ flex: 1, opacity: listOpacity }}>
      <FlatList
        ref={listRef}
        key={String(numColumns)}
        data={isSearchPending ? (Array.from({ length: isWeb ? 12 : 8 }).map((_, i) => ({ __skeleton: true, id: -i })) as any[]) : (filteredMovies as any[])}
        numColumns={numColumns}
        keyExtractor={(item, idx) => item && item.__skeleton ? `skeleton-${idx}` : item.id.toString()}
        renderItem={renderListItem}
        getItemLayout={getItemLayout}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between', paddingHorizontal: sizing.gutter } : { paddingHorizontal: sizing.gutter }}
        contentContainerStyle={{ paddingVertical: Math.round(sizing.gutter * 0.6), paddingHorizontal: sizing.gutter }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={() => { isInteractingRef.current = true; }}
        onScrollEndDrag={() => { isInteractingRef.current = false; }}
        onMomentumScrollBegin={() => { isInteractingRef.current = true; }}
        onMomentumScrollEnd={() => { isInteractingRef.current = false; }}
        extraData={favourites}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: Math.round(sizing.gutter * 0.8) }} /> : null}
        initialNumToRender={isWeb ? 12 : 6}
        windowSize={isWeb ? 10 : 8}
        // disable removeClippedSubviews due to reanimated transforms causing visual clipping on some devices
        removeClippedSubviews={false}
        maintainVisibleContentPosition={Platform.OS !== 'web' ? { minIndexForVisible: 0, autoscrollToTopThreshold: 5 } : undefined}
        updateCellsBatchingPeriod={isWeb ? 150 : 120}
        maxToRenderPerBatch={isWeb ? 8 : 6}
      />
      </Animated.View>
      {__DEV__ && (
        <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 6 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>Index: {getRenderCount('Index')}</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>MovieRenders: {getRenderCount('MovieAll')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f0f0f0" },
  title: { fontWeight: "bold", textAlign: "center" },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, borderWidth: 1, backgroundColor: "#fff" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageText: { fontSize: 16 },
  primaryButton: { ...(Shadow.medium as any) },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#ddd', ...(Shadow.small as any) },
  secondaryButtonText: { fontWeight: '700' },
});

