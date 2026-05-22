import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'

  const resolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => {
    return resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      theme: themeMode,
      setThemeMode,
      colors,
      isDark: resolvedTheme === 'dark',
    }),
    [themeMode, colors, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeContext;
