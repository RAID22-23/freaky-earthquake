import React, { useCallback } from "react";
import { Text, FlatList, StyleSheet, SafeAreaView, useWindowDimensions, Platform } from "react-native";
import { useRouter } from 'expo-router';
import NavBar from "./_components/NavBar";
import { useMovieContext } from "./_context/MovieContext";
import { useTheme } from "./_context/ThemeProvider";
import { getNumColumns, calcCardWidth } from './_utils/layout';
import MovieCard from "./_components/MovieCard";

export default function Favourites() {
  const { favourites } = useMovieContext();
  const router = useRouter();

  const { colors, sizing, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const numColumns = getNumColumns(width);
  const cardWidth = calcCardWidth(width, numColumns);

  const navigateToMovie = useCallback((id?: number) => {
    if (!id) return;
    router.push({ pathname: '/movie/[id]', params: { id: String(id) } });
  }, [router]);

  const renderMovieItem = useCallback(({ item }: { item: any }) => (
    <MovieCard movie={item} cardWidth={cardWidth} onPress={navigateToMovie} />
  ), [cardWidth, navigateToMovie]);

  const isWeb = Platform.OS === 'web';
  const itemHeight = Math.round(cardWidth * 1.4) + Math.round(sizing.gutter * 2) + Math.round(fonts.md * 2);
  const getItemLayout = useCallback((data: any, index: number) => ({ length: itemHeight, offset: itemHeight * Math.floor(index / numColumns), index }), [itemHeight, numColumns]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, padding: sizing.gutter }]}> 
      <NavBar />
      <Text style={[styles.title, { color: colors.text, fontSize: fonts.xl, marginBottom: sizing.gutter }]}>My Favourites</Text>
      {favourites.length === 0 ? (
        <Text style={{ color: colors.text }}>No favourite movies yet.</Text>
      ) : (
        <FlatList
          key={String(numColumns)}
          data={favourites}
          keyExtractor={(i) => i.id.toString()}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
          renderItem={renderMovieItem}
          getItemLayout={getItemLayout}
          initialNumToRender={isWeb ? 12 : 6}
          windowSize={isWeb ? 14 : 7}
          removeClippedSubviews
          maxToRenderPerBatch={8}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: "bold" },
});
