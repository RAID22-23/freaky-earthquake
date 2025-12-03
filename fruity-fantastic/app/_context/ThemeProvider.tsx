import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { COLORS, COLORS_DARK, SIZING as BASE_SIZING, FONT_SIZES as BASE_FONT_SIZES } from '../_utils/theme';
import { moderateScale } from '../_utils/scale';
import { useWindowDimensions, useColorScheme } from 'react-native';
import { Shadow } from '../_utils/styles';

interface ThemeContextType { colors: typeof COLORS; sizing: typeof BASE_SIZING; fonts: typeof BASE_FONT_SIZES; mode: 'light' | 'dark'; toggleTheme: () => void; shadows: { small: any; medium: any; large: any }; compact: boolean }
const defaultSizing = BASE_SIZING;
const defaultFonts = BASE_FONT_SIZES;
const ThemeContext = createContext<ThemeContextType>({ colors: COLORS, sizing: defaultSizing, fonts: defaultFonts, mode: 'light', toggleTheme: () => {}, shadows: { small: (Shadow.small as any), medium: (Shadow.medium as any), large: (Shadow.large as any) }, compact: false });

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');
  const colors = mode === 'dark' ? COLORS_DARK : COLORS;
  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  const { width } = useWindowDimensions();

  // Compute a scaled sizing and fonts based on current dimensions
  const sizing = {
    gutter: Math.max(6, Math.round(moderateScale(BASE_SIZING.gutter))),
    radius: Math.max(4, Math.round(moderateScale(BASE_SIZING.radius))),
  };
  const fonts = Object.fromEntries(Object.entries(BASE_FONT_SIZES).map(([k, v]) => [k, Math.max(10, Math.round(moderateScale(v as number)))])) as typeof BASE_FONT_SIZES;
  const compact = width < 360;

  // Adapt shadow for dark mode (lower opacity or elevation)
  const adaptShadow = (s: any, factor = 1) => {
    if (!s) return s;
    // shadowOpacity (iOS) vs elevation (android)
    if (s.shadowOpacity !== undefined) return { ...s, shadowOpacity: Math.max(0, Math.round((s.shadowOpacity * factor) * 100) / 100) };
    if (s.elevation !== undefined) return { ...s, elevation: Math.max(0, Math.round(s.elevation * factor)) };
    return s;
  };
  const shadows = useMemo(() => ({ small: adaptShadow(Shadow.small, mode === 'dark' ? 0.6 : 1), medium: adaptShadow(Shadow.medium, mode === 'dark' ? 0.7 : 1), large: adaptShadow(Shadow.large, mode === 'dark' ? 0.8 : 1) }), [mode]);
  return (
    <ThemeContext.Provider value={{ colors, sizing, fonts, mode, toggleTheme, shadows, compact }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
