import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Alert, SafeAreaView, Dimensions } from 'react-native';
import { Shadow } from '../utils/styles';
import AppButton from '../components/AppButton';
import { useTheme } from '../_context/ThemeProvider';
import { useMovieContext } from '../_context/MovieContext';
import { useToast } from '../_context/ToastContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {fetchMovieDetails} from '../utils/api'
import type { Movie } from '../_context/MovieContext';
// Removed direct COLORS import to use theme via `useTheme`.

export default function MovieDetails() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addFavourite, removeFavourite, isFavourite } = useMovieContext();
  const { colors, sizing, fonts } = useTheme();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMovieDetails(String(id));
        setMovie(data);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator style={{ marginTop: 20 }} /></View>;
  if (!movie) return (
    <View style={styles.center}>
      <Text>No data</Text>
      <AppButton variant="secondary" onPress={() => router.back()} style={{ backgroundColor: colors.card, paddingHorizontal: 12 }}>Back</AppButton>
    </View>
  );

  const toggleFav = () => {
    if (!movie) return;
    if (isFavourite(movie.id)) {
      removeFavourite(movie.id);
      toast.showToast('Removed from favourites', 'info');
    } else {
      addFavourite(movie);
      toast.showToast('Added to favourites', 'success');
    }
  };

  const width = Dimensions.get('window').width;
  

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, padding: sizing.gutter }]}> 
      <Image source={ movie.poster_path ? { uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` } : require('../../assets/images/partial-react-logo.png') } style={[styles.poster, { width: Math.min(width * 0.9, 360), aspectRatio: 2/3 }]} />
      <Text style={[styles.title, { fontSize: fonts.xl, color: colors.modalText }]}>{movie.title}</Text>
      <Text style={[styles.release, { color: colors.modalText, fontSize: fonts.sm,  }]}>Release Date: {movie.release_date}</Text>
      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.modalText }]}>{movie.vote_average}/10</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.modalText }}>Votes: {movie.vote_count}</Text>
        </View>
      </View>
      {movie.genres && movie.genres.length > 0 && (
        <View style={{ flexDirection: 'row', marginVertical: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {movie.genres.map((g) => (
            <View key={g.id} style={[styles.genreChip, { backgroundColor: colors.card, margin: 4 }]}>
              <Text style={{ fontWeight: '700', color: colors.modalText }}>{g.name}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Image carousel (poster + backdrop if exists) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} pagingEnabled>
        <Image source={ movie.poster_path ? { uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` } : require('../../assets/images/partial-react-logo.png') } style={{ width: width - 32, height: 280, borderRadius: 8, marginRight: 8 }} />
        {movie.backdrop_path && (
          <Image source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` }} style={{ width: width - 32, height: 280, borderRadius: 8 }} />
        )}
      </ScrollView>
      <Text style={[styles.overview, { fontSize: fonts.sm, color: colors.modalText }]}>{movie.overview || 'No overview available.'}</Text>
      <Text style={[styles.stats, { fontSize: fonts.sm, color: colors.modalText }]}>Rating: {movie.vote_average}/10 — Votes: {movie.vote_count}</Text>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
        <AppButton variant={isFavourite(movie.id) ? 'danger' : 'primary'} onPress={toggleFav} style={{ backgroundColor: isFavourite(movie.id) ? colors.danger : colors.primary }}>{isFavourite(movie.id) ? 'Remove from Favs' : 'Add to Favs'}</AppButton>
        <AppButton variant="secondary" onPress={() => router.back()} style={{ backgroundColor: colors.card }}>Back</AppButton>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  poster: { width: 250, height: 350, borderRadius: 8, marginBottom: 12 },
  title: { fontWeight: 'bold', textAlign: 'center' },
  release: { color: '#666', marginBottom: 8 },
  overview: { marginVertical: 12 },
  stats: {},
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { color: 'white', fontWeight: '700' },
  badgesRow: { flexDirection: 'row', marginVertical: 8 },
  genreChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  primaryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, ...(Shadow.medium as any) },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eaeaea', ...(Shadow.small as any) },
  secondaryButtonText: { fontWeight: '700' },
});
