import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import AppButton from './AppButton';
import { Shadow } from '../_utils/styles';
import { Link } from "expo-router";
import { useTheme } from "../_context/ThemeProvider";
import AppIconButton from './AppIconButton';

const NavBar: React.FC = () => {
  const { colors, sizing, fonts, mode, toggleTheme } = useTheme();
  return (
  <View style={[styles.nav, { backgroundColor: colors.card, paddingVertical: sizing.gutter / 2, paddingHorizontal: sizing.gutter, ...(Shadow.medium as any) }]}> 
    <Link href="/" asChild>
      <AppButton variant="ghost" style={styles.row}>
        <AppIconButton name={Platform.OS === 'ios' ? 'home-outline' : 'home'} size={20} color={colors.primary} variant="ghost" />
        <Text style={[styles.link, { color: colors.text, marginLeft: 8, fontSize: fonts.md }]}>{'Home'}</Text>
      </AppButton>
    </Link>
    <Link href="/favourites" asChild>
      <AppButton variant="ghost" style={styles.row}>
        <AppIconButton name={Platform.OS === 'ios' ? 'heart-outline' : 'heart'} size={20} color={colors.primary} variant="ghost" />
        <Text style={[styles.link, { color: colors.primary, marginLeft: 8, fontSize: fonts.md }]}>{'Favourites'}</Text>
      </AppButton>
    </Link>
    <AppIconButton name={mode === 'dark' ? 'sunny' : 'moon'} size={20} onPress={toggleTheme} variant="ghost" style={{ marginLeft: 8 }} accessibilityLabel="Toggle theme" />
  </View>
  );
};

const styles = StyleSheet.create({
  nav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, paddingHorizontal: 8 },
  row: { flexDirection: "row", alignItems: "center", },
  link: { fontSize: 16, fontWeight: "bold" },
});

export default NavBar;
