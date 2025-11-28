import React, { useEffect, useState, useRef } from "react";
import { Text, View, TextInput, FlatList, ActivityIndicator, StyleSheet, Alert, SafeAreaView, useWindowDimensions } from "react-native";
import { Shadow } from './utils/styles';
import AppButton from './components/AppButton';
import { useToast } from "./_context/ToastContext";
import { useRouter } from "expo-router";
import FilterBar from "./components/FilterBar";
import axios from "axios";
import MovieCard from "./components/MovieCard";
import NavBar from "./components/NavBar";
import type { Movie } from "./_context/MovieContext";

import { EXPO_PUBLIC_API_KEY } from "./utils/config";
import { useTheme } from "./_context/ThemeProvider";
import { getNumColumns, calcCardWidth } from './utils/layout';
const API_KEY = EXPO_PUBLIC_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export default function Index() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [minRating, setMinRating] = useState(0);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = getNumColumns(width);
  const cardWidth = calcCardWidth(width, numColumns);
  const { colors, sizing, fonts } = useTheme();

  const toast = useToast();
  const isFetchingRef = useRef(false);
  const fetchMovies = React.useCallback(async (query: string = "", page: number = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (page > 1) setLoadingMore(true);
    else setLoading(true);
    try {
      if (!API_KEY) {
        Alert.alert('API Key missing', 'Please configure the EXPO_PUBLIC_API_KEY in your environment or app.json');
        setMovies([]);
        setTotalPages(1);
        return;
      }
      const endpoint = query
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
      const response = await axios.get(endpoint);
      if (page > 1) setMovies((prev) => [...prev, ...response.data.results]);
      else setMovies(response.data.results);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.showToast('There was a problem fetching movies', 'error');
      Alert.alert('Network error', 'There was a problem fetching movies. Retry?', [
        { text: 'Retry', onPress: () => fetchMovies(query, page) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      if (page > 1) setLoadingMore(false);
      else setLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]);
  useEffect(() => {
    fetchMovies(activeQuery, currentPage);
  }, [activeQuery, currentPage, fetchMovies]);

  const handleSearch = () => {
    setActiveQuery(searchQuery);
    setCurrentPage(1);
  };

  // Next/Prev removed in favor of infinite scroll

  const handleEndReached = () => {
    if (!isFetchingRef.current && currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  // Prev removed in favor of infinite scroll

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background, padding: sizing.gutter }]}> 
      <NavBar />
      <Text style={[styles.title, { color: colors.text, fontSize: fonts.xxl }]}>Movie App</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for movies..."
          style={[styles.searchInput, { padding: Math.round(sizing.gutter * 0.6), borderRadius: Math.round(sizing.radius / 1.2), backgroundColor: colors.card } ]}
        />
        <AppButton variant="primary" onPress={handleSearch} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
          Search
        </AppButton>
      </View>
      {loading && <ActivityIndicator size="large" style={{ marginVertical: 12 }} />}
      <FilterBar value={minRating} onChange={setMinRating} />
      <FlatList
        key={String(numColumns)}
        data={movies.filter((m) => (m.vote_average ?? 0) >= minRating)}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MovieCard movie={item} cardWidth={cardWidth} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(item.id) } })} />
        )}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
        initialNumToRender={8}
        windowSize={10}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
      />
      {/* Pagination removed - infinite scroll replaces Prev/Next buttons */}
      {/* Modal replaced by dedicated details screen */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, backgroundColor: "#f0f0f0" },
  title: { fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  searchRow: { flexDirection: "row", marginBottom: 12, alignItems: "center" },
  searchInput: { flex: 1, borderWidth: 1, marginRight: 8, padding: 8, borderRadius: 6, backgroundColor: "#fff" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageText: { fontSize: 16 },
  primaryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, ...(Shadow.medium as any) },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, backgroundColor: '#ddd', ...(Shadow.small as any) },
  secondaryButtonText: { fontWeight: '700' },
});

