import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';

import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { fontAssets, ThemeProvider, useColorSchemePreference, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [stations] = useState(createStubStations);
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider>
      <StationsProvider stations={stations}>
        <ThemedNavigation />
      </StationsProvider>
    </ThemeProvider>
  );
}

/** Everything behind the screens must use the theme too, or it shows through during swipe-back. */
function ThemedNavigation() {
  const colors = useTheme();
  const { scheme } = useColorSchemePreference();
  const base = scheme === 'light' ? DefaultTheme : DarkTheme;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg.base);
  }, [colors]);

  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent.base,
          background: colors.bg.base,
          card: colors.surface.default,
          text: colors.text.default,
          border: colors.line.default,
          notification: colors.accent.base,
        },
      }}
    >
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}
      />
    </NavigationThemeProvider>
  );
}
