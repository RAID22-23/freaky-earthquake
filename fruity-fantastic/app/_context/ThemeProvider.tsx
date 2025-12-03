import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { COLORS, COLORS_DARK, SIZING as BASE_SIZING, FONT_SIZES as BASE_FONT_SIZES } from '../_utils/theme';
import { moderateScale } from '../_utils/scale';
import { useWindowDimensions, useColorScheme } from 'react-native';

interface ThemeContextType { colors: typeof COLORS; sizing: typeof BASE_SIZING; fonts: typeof BASE_FONT_SIZES; mode: 'light' | 'dark'; toggleTheme: () => void }
const defaultSizing = BASE_SIZING;
const defaultFonts = BASE_FONT_SIZES;
const ThemeContext = createContext<ThemeContextType>({ colors: COLORS, sizing: defaultSizing, fonts: defaultFonts, mode: 'light', toggleTheme: () => {} });

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
  return (
    <ThemeContext.Provider value={{ colors, sizing, fonts, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
