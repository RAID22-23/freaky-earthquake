import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Alert, SafeAreaView, Dimensions } from 'react-native';
import { Shadow } from '../_utils/styles';
import AppButton from '../_components/AppButton';
import { useTheme } from '../_context/ThemeProvider';
import { useMovieContext } from '../_context/MovieContext';
import { useToast } from '../_context/ToastContext';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { fetchMovieDetails } from '../_utils/api'
import type { Movie } from '../_context/MovieContext';

export default function MovieDetails() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();
  const { addFavourite, removeFavourite, isFavourite } = useMovieContext();
  const { colors, sizing, fonts } = useTheme();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMovieDetails(String(id));
        setMovie(data);
        // Set the navigation title to the movie title as soon as we fetch it
        if (data?.title) {
          // setOptions will update the header title shown by the native stack
          navigation.setOptions({ title: data.title });
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator style={{ marginTop: sizing.gutter }} /></View>;
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
      <Image source={ movie.poster_path ? { uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` } : require('../../assets/images/partial-react-logo.png') } style={[styles.poster, { width: Math.min(width * 0.9, 360), aspectRatio: 2/3, borderRadius: sizing.radius }]} />
      <Text style={[styles.title, { fontSize: fonts.xl, color: colors.modalText }]}>{movie.title}</Text>
      <Text style={[styles.release, { color: colors.modalText, fontSize: fonts.sm,  }]}>Release Date: {movie.release_date}</Text>
      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: colors.primary, paddingHorizontal: Math.round(sizing.gutter * 0.6), paddingVertical: Math.round(sizing.gutter * 0.3), borderRadius: Math.round(sizing.radius / 1.8) }]}>
          <Text style={[styles.badgeText, { color: colors.modalText }]}>{movie.vote_average}/10</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.card, paddingHorizontal: Math.round(sizing.gutter * 0.6), paddingVertical: Math.round(sizing.gutter * 0.3), borderRadius: Math.round(sizing.radius / 1.8) }]}>
          <Text style={{ color: colors.modalText }}>Votes: {movie.vote_count}</Text>
        </View>
      </View>
      {movie.genres && movie.genres.length > 0 && (
        <View style={{ flexDirection: 'row', marginVertical: Math.round(sizing.gutter * 0.6), flexWrap: 'wrap', justifyContent: 'center' }}>
          {movie.genres.map((g) => (
            <View key={g.id} style={[styles.genreChip, { backgroundColor: colors.card, margin: Math.round(sizing.gutter * 0.3), paddingHorizontal: Math.round(sizing.gutter * 0.8), paddingVertical: Math.round(sizing.gutter * 0.5), borderRadius: Math.round(sizing.gutter * 1.5) }]}>
              <Text style={{ fontWeight: '700', color: colors.modalText }}>{g.name}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Image carousel (poster + backdrop if exists) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Math.round(sizing.gutter * 0.6) }} pagingEnabled>
        <Image source={ movie.poster_path ? { uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` } : require('../../assets/images/partial-react-logo.png') } style={{ width: width - 32, height: Math.round((width - 32) * (2 / 3)), borderRadius: sizing.radius, marginRight: Math.round(sizing.gutter * 0.6) }} />
        {movie.backdrop_path && (
          <Image source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` }} style={{ width: width - 32, height: Math.round((width - 32) * (2 / 3)), borderRadius: sizing.radius }} />
        )}
      </ScrollView>
      <Text style={[styles.overview, { fontSize: fonts.sm, color: colors.modalText, marginVertical: sizing.gutter }]}>{movie.overview || 'No overview available.'}</Text>
      <Text style={[styles.stats, { fontSize: fonts.sm, color: colors.modalText }]}>Rating: {movie.vote_average}/10 — Votes: {movie.vote_count}</Text>
      <View style={{ marginTop: Math.round(sizing.gutter * 0.6), flexDirection: 'row' }}>
        <AppButton variant={isFavourite(movie.id) ? 'danger' : 'primary'} onPress={toggleFav} style={{ backgroundColor: isFavourite(movie.id) ? colors.danger : colors.primary, marginRight: Math.round(sizing.gutter * 0.3) }}>{isFavourite(movie.id) ? 'Remove from Favs' : 'Add to Favs'}</AppButton>
        <AppButton variant="secondary" onPress={() => router.back()} style={{ backgroundColor: colors.card, paddingHorizontal: Math.round(sizing.gutter * 1.2) }}>Back</AppButton>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  poster: { marginBottom: 12 },
  title: { fontWeight: 'bold', textAlign: 'center' },
  release: { color: '#666', marginBottom: 8 },
  overview: { },
  stats: {},
  badge: {},
  badgeText: { color: 'white', fontWeight: '700' },
  badgesRow: { flexDirection: 'row' },
  genreChip: {},
  primaryButton: { ...(Shadow.medium as any) },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#eaeaea', ...(Shadow.small as any) },
  secondaryButtonText: { fontWeight: '700' },
});
