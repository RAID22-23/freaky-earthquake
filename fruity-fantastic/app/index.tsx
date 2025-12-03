import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, TextInput, FlatList, ActivityIndicator, StyleSheet, Alert, SafeAreaView, useWindowDimensions, Image, Platform, AppState } from 'react-native';
import { Shadow } from './_utils/styles';
import AppButton from './_components/AppButton';
import { useToast } from './_context/ToastContext';
import { useRouter } from 'expo-router';
import FilterBar from './_components/FilterBar';
import { fetchMovies as apiFetchMovies, prefetchMovies as apiPrefetchMovies, prefetchMovieDetails as apiPrefetchMovieDetails } from './_utils/api';
import MovieCard from './_components/MovieCard';
import NavBar from './_components/NavBar';
import type { Movie } from './_context/MovieContext';
import { useTheme } from './_context/ThemeProvider';
import { getNumColumns, calcCardWidth } from './_utils/layout';


export default function Index() {
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

  // Guards and caches
  const prefetchPagesMapRef = useRef<Map<string, Set<number>>>(new Map());
  const fetchingQueryRef = useRef<string | null>(null);
  const loadedPagesRef = useRef<Map<string, Set<number>>>(new Map());
  const lastVisibleIdsRef = useRef<number[]>([]);
  const isFetchingRef = useRef(false);

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
  }, [activeQuery, totalPages]);

  // fetch movies with dedupe and loaded-page checks
  const fetchMovies = useCallback(async (query = '', page = 1) => {
    const qKey = query ?? '';
    const loadedSet = loadedPagesRef.current.get(qKey) ?? new Set<number>();
    if (loadedSet.has(page)) {
      // already loaded this page for this query
      return;
    }
    // allow fetch if currently fetching a different query
    if (isFetchingRef.current && fetchingQueryRef.current === query) return;
    fetchingQueryRef.current = query;
    isFetchingRef.current = true;
    if (page > 1) setLoadingMore(true); else setLoading(true);
    try {
      const response = await apiFetchMovies(query, page);
      if (page > 1) {
        setMovies((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const filtered = response.results.filter((r: any) => !existing.has(r.id));
          return [...prev, ...filtered];
        });
      } else {
        setMovies(response.results);
      }
      setTotalPages(response.total_pages);
      // mark as loaded
      const setPages = loadedPagesRef.current.get(qKey) ?? new Set<number>();
      setPages.add(page);
      loadedPagesRef.current.set(qKey, setPages);
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
      fetchingQueryRef.current = null;
      isFetchingRef.current = false;
    }
  }, [toast, prefetchNextPage]);

  useEffect(() => {
    fetchMovies(activeQuery, currentPage);
  }, [activeQuery, currentPage, fetchMovies]);

  // Reset loaded pages for a new search
  const handleSearch = () => {
    setActiveQuery(searchQuery);
    setCurrentPage(1);
    // Reset loaded page tracking for the new query, clear prefetch tracking and visible ids
    loadedPagesRef.current.set(searchQuery ?? '', new Set<number>());
    prefetchPagesMapRef.current.set(searchQuery ?? '', new Set<number>());
    lastVisibleIdsRef.current = [];
    // Prefetch page 2 for the new search query explicitly
    prefetchNextPage(2, searchQuery);
  };

  const handleEndReached = () => {
    if (!isFetchingRef.current && currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;
    const ids = viewableItems.map((v: any) => v.item?.id).filter(Boolean);
    // Save visible ids to allow prefetch on focus
    lastVisibleIdsRef.current = ids;
    // prefetch details for visible items
    apiPrefetchMovieDetails(ids).catch(() => {});
    // prefetch next page if near the end
    const lastVisible = viewableItems[viewableItems.length - 1];
    if (!lastVisible) return;
    const lastIndex = lastVisible.index ?? 0;
    if ((movies.length - lastIndex) <= (numColumns * 3)) {
      prefetchNextPage(currentPage + 1);
    }
    // prefetch visible posters
    try {
      viewableItems.forEach((v: any) => {
        const m = v?.item;
        if (!m) return;
        if (m.poster_path) Image.prefetch(`https://image.tmdb.org/t/p/w500${m.poster_path}`);
      });
    } catch { }
  }).current;

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
  const renderMovieItem = useCallback(({ item }: { item: Movie }) => (
    <MovieCard movie={item} cardWidth={cardWidth} onPress={navigateToMovie} />
  ), [cardWidth, navigateToMovie]);

  // Provide getItemLayout for constant-height rows (approximate) to help VirtualizedList
  const itemHeight = Math.round(cardWidth * 1.4) + Math.round(sizing.gutter * 2) + Math.round(fonts.md * 2);
  const getItemLayout = useCallback((data: any, index: number) => ({ length: itemHeight, offset: itemHeight * Math.floor(index / numColumns), index }), [itemHeight, numColumns]);

  const isWeb = Platform.OS === 'web';

  const filteredMovies = React.useMemo(() => movies.filter((m) => (m.vote_average ?? 0) >= minRating), [movies, minRating]);

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background, padding: sizing.gutter }]}>
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
      <FilterBar value={minRating} onChange={setMinRating} />
      <FlatList
        key={String(numColumns)}
        data={filteredMovies}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovieItem}
        getItemLayout={getItemLayout}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: Math.round(sizing.gutter * 0.8) }} /> : null}
        initialNumToRender={isWeb ? 12 : 6}
        windowSize={isWeb ? 14 : 7}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
      />
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

