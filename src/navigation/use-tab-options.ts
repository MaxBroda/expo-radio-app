import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';

import { fonts, useTheme } from '@/theme';

export function useTabOptions(area: 'listener' | 'studio'): BottomTabNavigationOptions {
  const colors = useTheme();

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.accent.base,
    tabBarInactiveTintColor: colors.text.muted,
    tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
    tabBarStyle: {
      backgroundColor: colors.tabBar[area],
      borderTopColor: colors.line.default,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    sceneStyle: { backgroundColor: area === 'studio' ? colors.bg.studio : colors.bg.base },
  };
}
