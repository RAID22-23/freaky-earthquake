import React from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import AppButton from './AppButton';
import { useTheme } from "../_context/ThemeProvider";
import AppIconButton from './AppIconButton';
import { Link, useRouter, useSegments } from "expo-router";

const NavBar: React.FC = () => {
  const { colors, sizing, fonts, mode, toggleTheme, shadows, compact } = useTheme();
  const { width } = useWindowDimensions();
  const showLabels = !compact && width >= 400;
  const segments = useSegments();
  const router = useRouter();
  const routeName = (() => {
    // segments: [] for '/', ['movie', '123'] for movie, ['favourites'] for favourites
    const s = segments?.[0];
    if (!s) return 'Home';
    if (s === 'favourites') return 'Favourites';
    if (s === 'movie') return 'Movie';
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  return (
  <View style={[styles.nav, { backgroundColor: colors.card, paddingVertical: sizing.gutter / 2, paddingHorizontal: sizing.gutter, ...(shadows.medium as any), borderBottomWidth: 1, borderBottomColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.06)' }]}> 
    <View style={styles.leftRow}>
      <AppButton variant="ghost" style={styles.row} onPress={() => router.push('/')}>
        <AppIconButton name={Platform.OS === 'ios' ? 'home-outline' : 'home'} size={20} color={colors.primary} variant="ghost" />
        {showLabels && <Text style={[styles.link, { color: colors.text, marginLeft: Math.round(sizing.gutter * 0.6), fontSize: fonts.md }]}>{'Home'}</Text>}
      </AppButton>
      <AppButton variant="ghost" style={[styles.row, { marginLeft: Math.round(sizing.gutter * 0.8) }]} onPress={() => router.push('/favourites')}> 
        <AppIconButton name={Platform.OS === 'ios' ? 'heart-outline' : 'heart'} size={20} color={colors.primary} variant="ghost" />
        {showLabels && <Text style={[styles.link, { color: colors.primary, marginLeft: Math.round(sizing.gutter * 0.6), fontSize: fonts.md }]}>{'Favourites'}</Text>}
      </AppButton>
    </View>
    {!compact && (
      <View style={styles.centerRow} pointerEvents="none">
        <Text style={[styles.centerTitle, { color: colors.text, fontSize: fonts.md }]}>{routeName}</Text>
      </View>
    )}
    <View style={styles.rightRow}>
      <AppIconButton name={mode === 'dark' ? 'sunny' : 'moon'} size={20} onPress={toggleTheme} variant="ghost" style={{ marginLeft: Math.round(sizing.gutter * 0.6) }} accessibilityLabel="Toggle theme" />
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  nav: { flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  row: { flexDirection: "row", alignItems: "center", },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  centerRow: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rightRow: { flexDirection: 'row', alignItems: 'center' },
  link: { fontSize: 16, fontWeight: "bold" },
  centerTitle: { fontWeight: '700', textAlign: 'center' }
});

export default NavBar;
