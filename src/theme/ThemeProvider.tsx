import React, {createContext, useContext, useMemo, useState} from 'react';

export type ThemeMode = 'light' | 'dark';

export const appThemes = {
  light: {
    mode: 'light' as ThemeMode,
    background: '#EEF7EC',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F8F1',
    nav: '#C9DEBF',
    navIndicator: '#EEF7EC',
    bubble: '#FFFFFF',
    input: '#FFFFFF',
    accent: '#E8A5B8',
    accentMuted: '#FFF3F7',
    accentText: '#FFFFFF',
    text: '#2F352F',
    textMuted: '#788276',
    border: '#E7ECE3',
    iconSurface: '#EEF7EC',
    icon: '#5F705C',
    pressed: '#F4F8F1',
    placeholder: '#9AA397',
    warning: '#C48239',
    characterFeature: '#151515',
    chart: ['#E8A5B8', '#E9B872', '#C9DEBF', '#8BA6A9', '#B8A7D9'],
    stressWorst: '#E5675F',
    stressBad: '#E3A93B',
    stressNormal: '#6FB07F',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    background: '#1A1C19',
    surface: '#252722',
    surfaceMuted: '#2E302B',
    nav: '#3A3D35',
    navIndicator: '#4B4F44',
    bubble: '#282A25',
    input: '#282A25',
    accent: '#82616A',
    accentMuted: '#33292D',
    accentText: '#F4ECEF',
    text: '#F0F1EA',
    textMuted: '#B7BAAF',
    border: '#3A3D36',
    iconSurface: '#30332D',
    icon: '#D8DACF',
    pressed: '#2B2E28',
    placeholder: '#7F857A',
    warning: '#D9A066',
    characterFeature: '#151515',
    chart: ['#82616A', '#E9B872', '#C9DEBF', '#8BA6A9', '#B8A7D9'],
    stressWorst: '#F07B73',
    stressBad: '#F0C25E',
    stressNormal: '#86C795',
  },
};

export type AppTheme = typeof appThemes.light;

interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const value = useMemo(
    () => ({
      theme: appThemes[themeMode],
      themeMode,
      toggleThemeMode: () => {
        setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
      },
    }),
    [themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useAppTheme = () => {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return value;
};
