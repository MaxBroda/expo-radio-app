import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { fontAssets, ThemeProvider, useColorSchemePreference } from '@/theme';

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
        <ThemedStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </StationsProvider>
    </ThemeProvider>
  );
}

function ThemedStatusBar() {
  const { scheme } = useColorSchemePreference();
  return <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />;
}
