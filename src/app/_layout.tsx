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

import { DemoClock, demoMoment } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import { RoleProvider, useRole } from '@/role/role-provider';
import { schedule } from '@/seed/schedule';
import { RatingProvider } from '@/stations/rating-provider';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { fontAssets, ThemeProvider, useColorSchemePreference, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function createRuntime() {
  const clock = new DemoClock(demoMoment(schedule.slot('feierabend')));
  const settings = new DemoSettings();
  const stations = createStubStations(
    {
      now: () => clock.now(),
      flags: () => settings.get(),
    },
    clock,
  );

  return { clock, settings, stations };
}

export default function RootLayout() {
  const [{ clock, settings, stations }] = useState(createRuntime);
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const canRender = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (canRender) {
      SplashScreen.hideAsync();
    }
  }, [canRender]);

  if (!canRender) {
    return null;
  }

  return (
    <ThemeProvider>
      <DemoProvider clock={clock} settings={settings}>
        <StationsProvider stations={stations}>
          <RatingProvider clock={clock} feedbackHub={stations.feedbackHub}>
            <RoleProvider>
              <ApplicationNavigator />
            </RoleProvider>
          </RatingProvider>
        </StationsProvider>
      </DemoProvider>
    </ThemeProvider>
  );
}

function ApplicationNavigator() {
  const colors = useTheme();
  const { scheme } = useColorSchemePreference();
  const { role } = useRole();
  const navigationBase = scheme === 'light' ? DefaultTheme : DarkTheme;
  const navigationTheme = {
    ...navigationBase,
    colors: {
      ...navigationBase.colors,
      primary: colors.accent.base,
      background: colors.bg.base,
      card: colors.surface.default,
      text: colors.text.default,
      border: colors.line.default,
      notification: colors.accent.base,
    },
  };

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg.base);
  }, [colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
        }}
      >
        <Stack.Protected guard={role === 'listener'}>
          <Stack.Screen name="(listener)" />
          <Stack.Screen name="rate/track" options={{ presentation: 'modal' }} />
          <Stack.Screen name="rate/show" options={{ presentation: 'modal' }} />
          <Stack.Screen name="wish/sent" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={role === 'moderator'}>
          <Stack.Screen name="(studio)" />
        </Stack.Protected>
        <Stack.Screen
          name="demo"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="components" />
      </Stack>
    </NavigationThemeProvider>
  );
}
