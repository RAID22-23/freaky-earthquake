import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { COLORS, COLORS_DARK, SIZING, FONT_SIZES } from '../../_utils/theme';
import { useColorScheme } from 'react-native';

interface ThemeContextType { colors: typeof COLORS; sizing: typeof SIZING; fonts: typeof FONT_SIZES; mode: 'light' | 'dark'; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextType>({ colors: COLORS, sizing: SIZING, fonts: FONT_SIZES, mode: 'light', toggleTheme: () => {} });

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');
  const colors = mode === 'dark' ? COLORS_DARK : COLORS;
  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  return (
    <ThemeContext.Provider value={{ colors, sizing: SIZING, fonts: FONT_SIZES, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
