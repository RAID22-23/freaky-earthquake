import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import AppButton from './AppButton';
import AppIconButton from './AppIconButton';
import { calcCardWidth } from '../utils/layout';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { prefetchMovieDetails } from '../utils/api';
import { useMovieContext, Movie } from "../_context/MovieContext";
import { useToast } from "../_context/ToastContext";
import { useTheme } from "../_context/ThemeProvider";
// Ionicons moved to AppIconButton, not used here directly
import { Shadow } from '../utils/styles';

interface MovieCardProps {
  movie: Movie;
  cardWidth?: number;
  onPress?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, cardWidth, onPress }) => {
  const { addFavourite, removeFavourite, isFavourite } = useMovieContext();
  const { colors, sizing, fonts } = useTheme();
  const anim = useSharedValue(0.95);
  const favAnim = useSharedValue(1);

  useEffect(() => { anim.value = withTiming(1, { duration: 250 }); }, [anim]);

  const toast = useToast();
  const preventNavRef = React.useRef(false);
  const handleFavourite = () => {
    if (isFavourite(movie.id)) {
      removeFavourite(movie.id);
      toast.showToast('Removed from favourites', 'info');
    } else {
      addFavourite(movie);
      toast.showToast('Added to favourites', 'success');
    }
  };

  const handlePressIn = () => { anim.value = withTiming(0.98, { duration: 120 }); };
  const handlePressOut = () => { anim.value = withTiming(1, { duration: 160 }); };

  const posterUri = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined;
  const { width } = useWindowDimensions();
  const dynamicCardWidth = calcCardWidth(width);
  const widthPx = Math.max(120, Math.min(cardWidth ?? dynamicCardWidth ?? 160, 300));
  const posterHeight = Math.round(widthPx * 1.4);

  const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: anim.value }] }));
  const rFavStyle = useAnimatedStyle(() => ({ transform: [{ scale: favAnim.value }] }));

  // sizing already taken from useTheme above
  const handleActionPress = (fn: () => void) => {
    // set flag so parent nav is prevented briefly
    preventNavRef.current = true;
    try { fn(); } finally {
      setTimeout(() => { preventNavRef.current = false; }, 200);
    }
  };

  const handleCardPress = () => {
    if (preventNavRef.current) return;
    // Prefetch the details for this movie to speed up navigation
    try { prefetchMovieDetails([movie.id]); } catch { }
    onPress?.();
  };

  return (
    <Pressable onPress={handleCardPress} onPressIn={handlePressIn} onPressOut={handlePressOut} android_ripple={{ color: '#0000001a' }}>
      <Reanimated.View style={[styles.card, Shadow.small as any, rStyle, { backgroundColor: colors.card, width: widthPx, margin: sizing.gutter / 1.5, borderRadius: sizing.radius }]} >
        <View style={[styles.accentStrip, { backgroundColor: colors.accent, width: Math.max(4, Math.round(sizing.gutter / 2)) }]} />
      <Image
        source={ posterUri ? { uri: posterUri } : require("../../assets/images/partial-react-logo.png") }
        style={[styles.poster, { height: posterHeight, borderRadius: sizing.radius } as any]}
        resizeMode="cover"
      />
      <View style={[styles.info, { padding: Math.round(sizing.gutter * 0.6) }] }>
        <Text style={[styles.title, { color: colors.cardText, fontSize: fonts.md }]} numberOfLines={2}>{movie.title}</Text>
        <Text style={[styles.date, { color: colors.muted, fontSize: fonts.sm }]}>{movie.release_date}</Text>
        <View style={[styles.actions, { marginTop: Math.round(sizing.gutter * 0.5) }]}>
          <Reanimated.View style={rFavStyle}>
            <AppIconButton name={isFavourite(movie.id) ? 'heart' : 'heart-outline'} size={18} color={isFavourite(movie.id) ? colors.danger : colors.muted} onPress={() => handleActionPress(() => { handleFavourite(); favAnim.value = withSpring(1.3); setTimeout(() => { favAnim.value = withSpring(1);}, 100); })} style={[styles.iconButton, { width: 36, height: 36, padding: 0, borderRadius: 36 }]} accessibilityLabel={isFavourite(movie.id) ? 'Remove from favourites' : 'Add to favourites'} />
          </Reanimated.View>
          <AppButton
            onPress={() => handleActionPress(handleFavourite)}
            variant={isFavourite(movie.id) ? 'danger' : 'primary'}
            style={[styles.actionButton, { paddingHorizontal: 10 }]}
            >
            {isFavourite(movie.id) ? 'Remove' : 'Add'}
          </AppButton>
        </View>
      </View>
      </Reanimated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "column",
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: "hidden",
  },
  // cardShadow: centralized in utils/styles (Shadow.small)
  poster: {
    width: "100%",
    // use aspectRatio to be flexible (3 columns for larger screens preserve a stable look)
    aspectRatio: 2/3,
    height: undefined,
  },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  info: {
    flex: 1,
    padding: 8,
    justifyContent: "flex-start",
    alignItems: 'center',
  },
  title: { fontWeight: "bold", textAlign: 'center', marginTop: 6 },
  date: { color: "#666", textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  iconButton: { padding: 6, borderRadius: 6 },
  actionButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  actionButtonText: { color: '#fff', fontWeight: '700' },
});

export default MovieCard;
