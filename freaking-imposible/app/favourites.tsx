import React from "react";
import { Text, FlatList, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import NavBar from "./_components/NavBar";
import { useMovieContext } from "./_context/MovieContext";
import { useTheme } from "./_context/ThemeProvider";
import { getNumColumns, calcCardWidth } from './_utils/layout';
import MovieCard from "./_components/MovieCard";

export default function Favourites() {
  const { favourites } = useMovieContext();

  const { colors, sizing, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const numColumns = getNumColumns(width);
  const cardWidth = calcCardWidth(width, numColumns);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, padding: sizing.gutter }]}> 
      <NavBar />
      <Text style={[styles.title, { color: colors.text, fontSize: fonts.xl }]}>My Favourites</Text>
      {favourites.length === 0 ? (
        <Text style={{ color: colors.text }}>No favourite movies yet.</Text>
      ) : (
        <FlatList
          key={String(numColumns)}
          data={favourites}
          keyExtractor={(i) => i.id.toString()}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
          renderItem={({ item }) => <MovieCard movie={item} cardWidth={cardWidth} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontWeight: "bold", marginBottom: 12 },
});
