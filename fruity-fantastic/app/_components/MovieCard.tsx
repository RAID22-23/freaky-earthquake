import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, useWindowDimensions, Animated } from "react-native";
import renderCounter from '../_utils/renderCounter';
import AppButton from './AppButton';
import AppIconButton from './AppIconButton';
import { Ionicons } from '@expo/vector-icons';
import { calcCardWidth } from '../_utils/layout';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { prefetchMovieDetails } from '../_utils/api';
import type { Movie } from "../_context/MovieContext";
import { useToast } from "../_context/ToastContext";
import { useTheme } from "../_context/ThemeProvider";
// Ionicons moved to AppIconButton, not used here directly
import { Shadow } from '../_utils/styles';

interface MovieCardProps {
  movie?: Movie;
  cardWidth?: number;
  // New signature: onPress receives movie id so parent can reuse single handler
  onPress?: (id?: number) => void;
  isFavourite?: boolean;
  onToggleFavourite?: (id?: number) => void;
  loading?: boolean;
  onMeasure?: (h: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, cardWidth, onPress, isFavourite, onToggleFavourite, loading = false, onMeasure }) => {
  // Prefer the parent to pass the favourite state & handler so context updates don't re-render all cards
  // The movie context will be used higher-up (in index) to create stable handlers.
  const isFavProp = isFavourite ?? false;
  const { colors, sizing, fonts, shadows, mode } = useTheme();
  const anim = useSharedValue(0.95);
  const favAnim = useSharedValue(1);

  useEffect(() => { anim.value = withTiming(1, { duration: 250 }); }, [anim]);

  // poster loading animation state & opacity
  const [posterLoaded, setPosterLoaded] = useState(false);
  const posterOpacity = React.useRef(new Animated.Value(0)).current;

  // prepare poster loading state
  // posterLoaded and posterOpacity declared earlier
  // skeleton animation for loading state
  const pulse = React.useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // poster fade in when loaded
  useEffect(() => {
    if (posterLoaded) {
      Animated.timing(posterOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [posterLoaded, posterOpacity]);

  const toast = useToast();
  const preventNavRef = React.useRef(false);
  const handleFavourite = () => {
    try {
      // Delegate favourite logic to parent via prop to avoid consuming context directly
      onToggleFavourite?.(movie?.id);
      toast.showToast(isFavProp ? 'Removed from favourites' : 'Added to favourites', isFavProp ? 'info' : 'success');
    } catch {}
  };

  const handlePressIn = () => { anim.value = withTiming(0.98, { duration: 120 }); };
  const handlePressOut = () => { anim.value = withTiming(1, { duration: 160 }); };

  const posterUri = movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined;
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
    if (!movie) return;
    try { prefetchMovieDetails([movie.id]); } catch { }
    onPress?.(movie.id);
  };

  if (loading) {
    // Render skeleton placeholder
    const w = Math.max(120, Math.min(cardWidth ?? dynamicCardWidth ?? 160, 300));
    const ph = Math.round(w * 1.4);
    return (
      <View style={[styles.card, { width: w, marginVertical: Math.round(sizing.gutter * 0.6), borderRadius: sizing.radius, backgroundColor: colors.card, alignSelf: 'center', overflow: 'hidden' }]}> 
        <Animated.View style={{ opacity: pulse, backgroundColor: colors.muted + '22', height: ph, width: '100%' }} />
        <View style={{ padding: Math.round(sizing.gutter * 0.8) }}>
          <Animated.View style={{ opacity: pulse, backgroundColor: colors.muted + '22', height: fonts.md, width: '70%', borderRadius: 6 }} />
          <Animated.View style={{ height: fonts.sm, width: '50%', marginTop: Math.round(sizing.gutter * 0.4), opacity: pulse, backgroundColor: colors.muted + '18', borderRadius: 6 }} />
        </View>
      </View>
    );
  }
  if (!movie) return null;

  return (
    <Pressable onPress={handleCardPress} onPressIn={handlePressIn} onPressOut={handlePressOut} android_ripple={{ color: '#0000001a' }} onLayout={(e) => { onMeasure?.(e.nativeEvent.layout.height); }}>
      <Reanimated.View style={[styles.card, (shadows.small as any), rStyle, { backgroundColor: colors.card, width: widthPx, marginVertical: Math.round(sizing.gutter * 0.6), borderRadius: sizing.radius, alignSelf: 'center', borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' }]} >
          <View style={[styles.accentStrip, { backgroundColor: colors.accent, width: Math.max(3, Math.round(sizing.gutter * 0.2)) }]} />
          {isFavProp ? (
            <View style={[styles.favBadge, { backgroundColor: colors.danger, right: Math.round(sizing.gutter * 0.6), top: Math.round(sizing.gutter * 0.5) }]}>
              <Ionicons name="heart" size={Math.round(sizing.gutter * 1)} color={colors.card} />
            </View>
          ) : null}
      <View style={{ width: '100%', height: posterHeight, borderTopLeftRadius: sizing.radius, borderTopRightRadius: sizing.radius, overflow: 'hidden', backgroundColor: colors.muted + '11' }}>
        {!posterLoaded && <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.muted + '22', opacity: pulse }} />}
        <Animated.Image
          source={ posterUri ? { uri: posterUri } : require("../../assets/images/partial-react-logo.png") }
          onLoadEnd={() => setPosterLoaded(true)}
          style={[styles.poster, { height: posterHeight, opacity: posterOpacity, marginBottom: Math.round(sizing.gutter * 0.8) } as any]}
          resizeMode="cover"
        />
      </View>
      <View style={[styles.info, { padding: Math.round(sizing.gutter * 0.75) }] }>
        <Text style={[styles.title, { color: colors.cardText, fontSize: fonts.md, marginTop: Math.round(sizing.gutter * 0.25), textAlign: 'left' }]} numberOfLines={2}>{movie.title}</Text>
        <Text style={[styles.date, { color: colors.muted, fontSize: fonts.sm }]}>{movie.release_date}</Text>
        <View style={[styles.actions, { marginTop: Math.round(sizing.gutter * 0.5), alignSelf: 'stretch' }]}>
          <Reanimated.View style={rFavStyle}>
            <AppIconButton name={isFavProp ? 'heart' : 'heart-outline'} size={Math.round(Math.max(14, Math.round(sizing.gutter * 0.9)))} color={isFavProp ? colors.danger : colors.muted} onPress={() => handleActionPress(() => { handleFavourite(); favAnim.value = withSpring(1.3); setTimeout(() => { favAnim.value = withSpring(1);}, 100); })} style={[styles.iconButton, { width: Math.round(sizing.gutter * 3), height: Math.round(sizing.gutter * 3), padding: 0, borderRadius: Math.round(sizing.gutter * 3) }]} accessibilityLabel={isFavProp ? 'Remove from favourites' : 'Add to favourites'} />
          </Reanimated.View>
          <AppButton
            onPress={() => handleActionPress(handleFavourite)}
            variant={isFavProp ? 'danger' : 'primary'}
            style={[styles.actionButton, { paddingHorizontal: Math.round(sizing.gutter * 0.8), paddingVertical: Math.round(sizing.gutter * 0.48), borderRadius: Math.round(sizing.radius / 1.5), marginLeft: Math.round(sizing.gutter * 0.8), alignSelf: 'flex-end', minWidth: Math.round(widthPx * 0.28) }]}
            >
            {isFavProp ? 'Remove' : 'Add'}
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
    overflow: "hidden",
  },
  // cardShadow: centralized in utils/styles (Shadow.small)
  poster: {
    width: "100%",
    // use aspectRatio to be flexible (3 columns for larger screens preserve a stable look)
    aspectRatio: 2/3,
    height: undefined,
  },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  info: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: 'flex-start',
  },
  title: { fontWeight: "bold", textAlign: 'center' },
  date: { color: "#666", textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: {  },
  actionButton: { },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  favBadge: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
});

const areEqual = (prev: MovieCardProps, next: MovieCardProps) => {
  // Compare shallow key movie props that affect rendering and interactive state.
  const p = prev.movie;
  const n = next.movie;
  const sameMovieId = p?.id === n?.id;
  const sameTitle = p?.title === n?.title;
  const samePoster = p?.poster_path === n?.poster_path;
  const sameVote = p?.vote_average === n?.vote_average && p?.vote_count === n?.vote_count;
  const sameCardWidth = prev.cardWidth === next.cardWidth;
  const sameOnPress = prev.onPress === next.onPress;
  const sameIsFav = prev.isFavourite === next.isFavourite;
  return sameMovieId && sameTitle && samePoster && sameVote && sameCardWidth && sameOnPress && sameIsFav;
};

export default React.memo(MovieCard, areEqual);
