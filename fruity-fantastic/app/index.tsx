import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, TextInput, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, useWindowDimensions, Image, Platform, AppState, Animated } from 'react-native';
import { Shadow } from './_utils/styles';
import { incrementRenderCount, getRenderCount, useRenderCounter } from './_utils/renderCounter';
import AppButton from './_components/AppButton';
import { useToast } from './_context/ToastContext';
import { useRouter } from 'expo-router';
import FilterBar from './_components/FilterBar';
import { fetchMovies as apiFetchMovies, prefetchMovies as apiPrefetchMovies, prefetchMovieDetails as apiPrefetchMovieDetails } from './_utils/api';
import useInfiniteMovies from './_hooks/useInfiniteMovies';
import MovieCard from './_components/MovieCard';
import { useMovieContext } from './_context/MovieContext';
import NavBar from './_components/NavBar';
import type { Movie } from './_context/MovieContext';
import { useTheme } from './_context/ThemeProvider';
import { getNumColumns, calcCardWidth } from './_utils/layout';


export default function Index() {
  useRenderCounter('Index');
  const [searchQuery, setSearchQuery] = useState('');
  const { items: movies, isLoading: loading, isLoadingMore: loadingMore, currentPage, totalPages, query: activeQuery, setQuery: setActiveQuery, fetchPage, fetchNext, prefetchPage, reset, appendPrevious, appendNext, visibleStart, visibleEnd } = useInfiniteMovies(apiFetchMovies, '', { prefetchRadius: 1 });
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

  // Reusable refs for viewability, scroll restoration and interaction tracking
  const lastVisibleIdsRef = useRef<number[]>([]);
  const lastVisibleIndexRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const listRef = useRef<any>(null);
  const lastEndReachedRef = useRef<number>(0);
  const lastAppendRef = useRef<{ time: number; pages: number[]; direction?: 'append'|'prepend'; insertedCount?: number; prevTopIndex?: number }>({ time: 0, pages: [] });
  const suppressViewabilityRef = useRef(false);
  const [isSearchPending, setIsSearchPending] = useState(false);

  // Prefetch helper: idempotent due to server caching & local cache layer in fetchFn
  const prefetchNextPage = useCallback((page: number, q?: string) => {
    if (!page) return;
    const qKey = (q ?? activeQuery) ?? '';
    if (page > (totalPages ?? Infinity)) return;
    // Update hook cache & the low-level API cache if possible -- both are fine to be called
    prefetchPage(page);
    apiPrefetchMovies(qKey, page).catch(() => {});
    if (__DEV__) console.debug('[prefetchNextPage] scheduled', qKey, page);
  }, [activeQuery, totalPages, prefetchPage]);

  // We use `useInfiniteMovies` custom hook to control pagination and avoid excessive duplication.
  // We still call `prefetchMovies` from the API helper in some cases to warm the cache (optional).

  // Trigger the first page whenever the active query changes
  useEffect(() => {
    // Wrap in async to catch errors and show toasts
    const doFetch = async () => {
      try {
        await fetchPage(1, { makeVisible: true });
      } catch (e) {
        toast.showToast('There was a problem fetching movies', e instanceof Error ? 'error' : 'info');
      }
    };
    doFetch();
  }, [activeQuery, fetchPage, toast]);

  // Reset and perform search - uses the hook's reset + fetchPage for a clear, simple behavior
  const handleSearch = async () => {
    if (!searchQuery) {
      setActiveQuery('');
      reset('');
      return;
    }
    setIsSearchPending(true);
    try {
      // reset clears the internal state and query version so responses don't interleave
      reset(searchQuery);
      // clear append marker (this is a replace, not append)
      lastAppendRef.current = { time: 0, pages: [] };
      suppressViewabilityRef.current = false;
      setActiveQuery(searchQuery);
      await fetchPage(1, { makeVisible: true });
      // warm cache for next page
      prefetchNextPage(2, searchQuery);
    } catch (e) {
      console.error('Search error', e);
      toast.showToast('There was a problem searching', 'error');
    } finally {
      setIsSearchPending(false);
    }
    return;
  };

  // handleEndReached moved below `filteredMovies` definition so it can include filteredMovies in deps

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
    if (!suppressViewabilityRef.current && (filteredMoviesRef.current.length - lastIndex) <= (numColumns * 3) && !loading && !loadingMore) {
      const next = currentPage + 1;
      if (next <= (totalPages ?? Infinity)) prefetchNextPage(next);
    }
    // If user is near the top, try to load previous page (prepend) transparently
    if (!suppressViewabilityRef.current && topIndex <= (numColumns * 2) && visibleStart > 1 && !loading && !loadingMore) {
      const prevPage = visibleStart - 1;
      const prevTopIndex = lastVisibleIndexRef.current ?? 0;
      (async () => {
        try {
          const inserted = await appendPrevious();
          if (inserted > 0) {
            lastAppendRef.current = { time: Date.now(), pages: [prevPage], direction: 'prepend', insertedCount: inserted, prevTopIndex };
            // adjust scroll so previously-top item remains visible in same place
            try {
              suppressViewabilityRef.current = true;
              const newIndex = Math.min((prevTopIndex + inserted), Math.max(0, filteredMoviesRef.current.length - 1));
              listRef.current?.scrollToIndex({ index: newIndex, animated: false });
              setTimeout(() => { suppressViewabilityRef.current = false; }, 300);
            } catch { suppressViewabilityRef.current = false; }
          }
        } catch {
          // ignore
        }
      })();
    }
    // prefetch visible posters
    try {
      viewableItems.forEach((v: any) => {
        const m = v?.item;
        if (!m) return;
        if (m.poster_path) Image.prefetch(`https://image.tmdb.org/t/p/w500${m.poster_path}`);
      });
    } catch { }
  }, [prefetchNextPage, currentPage, numColumns, totalPages, loading, loadingMore, visibleStart, appendPrevious]);

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
  }, [renderMovieItem, cardWidth, measuredItemHeight, computedItemHeight]);


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

  // Declared after filteredMovies is available so we can reference its length in deps
  const handleEndReached = useCallback(() => {
    // throttle repeated calls
    const now = Date.now();
    if (now - (lastEndReachedRef.current ?? 0) < 600) return;
    lastEndReachedRef.current = now;
    const nextPage = currentPage + 1;
    if (nextPage > (totalPages ?? Infinity)) return;
    if (loading || loadingMore) return;
    if (__DEV__) console.debug('[handleEndReached] requesting page', nextPage, 'current', currentPage, 'total', totalPages, 'moviesLen', movies.length, 'filteredLen', filteredMovies.length);
    lastAppendRef.current = { time: Date.now(), pages: [nextPage], direction: 'append' };
    const p = fetchNext?.();
    if (p) p.catch(() => {});
  }, [currentPage, totalPages, loading, loadingMore, movies.length, fetchNext, filteredMovies.length]);

  // Debug changes in movies/filteredMovies length
  useEffect(() => {
    if (__DEV__) console.debug('[moviesState] moviesLen', movies.length, 'filteredLen', filteredMovies.length);
  }, [movies.length, filteredMovies.length]);
  // (we rely on a stable but updated callback for viewability, so refs for currentPage/numColumns are not needed)

  // Restore scroll position if the list updates and we had a stable visible item before change
  const lastActiveQueryRef = useRef(activeQuery);
  useEffect(() => {
    if (!listRef.current) return;
    // If the user is interacting (scrolling) do not adjust scroll position
    if (isInteractingRef.current) return;
    // If active query changed since last time, skip restoring to avoid odd jumps.
    if (lastActiveQueryRef.current !== activeQuery) { lastActiveQueryRef.current = activeQuery; return; }
    // If we recently prepended pages, attempt to restore to keep the previous top in place
    const lastAppend = lastAppendRef.current;
    if (lastAppend.direction === 'prepend' && lastAppend.time && Date.now() - lastAppend.time < 2000 && lastAppend.insertedCount && typeof lastAppend.prevTopIndex === 'number') {
      try {
        suppressViewabilityRef.current = true;
        const newIndex = Math.min((lastAppend.prevTopIndex + (lastAppend.insertedCount ?? 0)), Math.max(0, filteredMovies.length - 1));
        listRef.current?.scrollToIndex({ index: newIndex, animated: false });
        setTimeout(() => { suppressViewabilityRef.current = false; lastAppendRef.current = { time: 0, pages: [] }; }, 300);
      } catch { suppressViewabilityRef.current = false; }
      return;
    }
    // If we recently appended items at the end, skip restoring because the top likely didn't move
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
        // Scroll to the new index so the same item stays visible if it still exists
        try {
          suppressViewabilityRef.current = true;
          listRef.current?.scrollToIndex({ index: newIndex, animated: false });
          setTimeout(() => { suppressViewabilityRef.current = false; }, 300);
        } catch { suppressViewabilityRef.current = false; }
      } else if (newIndex < 0 && prevTopIndex != null) {
        // If previous top ID no longer exists, keep the same index (clamped)
        const newIdx = Math.min(prevTopIndex, Math.max(0, filteredMovies.length - 1));
        try {
          suppressViewabilityRef.current = true;
          listRef.current?.scrollToIndex({ index: newIdx, animated: false });
          setTimeout(() => { suppressViewabilityRef.current = false; }, 300);
        } catch { suppressViewabilityRef.current = false; }
      }
    } else if (prevTopIndex != null) {
      const idx = Math.min(prevTopIndex, Math.max(0, filteredMovies.length - 1));
      try {
        suppressViewabilityRef.current = true;
        listRef.current?.scrollToIndex({ index: idx, animated: false });
        setTimeout(() => { suppressViewabilityRef.current = false; }, 300);
      } catch { suppressViewabilityRef.current = false; }
    }
  }, [filteredMovies, movies.length, activeQuery]);

  // Watchdog: if we're near the end, not actively fetching, and not currently interacting, try to load next page
  useEffect(() => {
    const id = setInterval(() => {
      if (!listRef.current) return;
      if (isInteractingRef.current) return;
      if (loading || loadingMore) return;
      if (currentPage >= (totalPages ?? Infinity)) return;
      const lastIndex = lastVisibleIndexRef.current ?? 0;
      if ((filteredMovies.length - lastIndex) <= (numColumns * 3)) {
        if (__DEV__) console.debug('[watchdog] near end, requesting next page', currentPage + 1);
        handleEndReached();
      }
    }, 2500);
    return () => clearInterval(id);
  }, [currentPage, totalPages, filteredMovies.length, numColumns, handleEndReached, loading, loadingMore]);

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

