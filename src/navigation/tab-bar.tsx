import type { TabNavigationState } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui';
import { fonts, spacing, touchTarget, useTheme } from '@/theme';

type Area = 'listener' | 'studio';
type IconProps = { focused: boolean; color: string };

// expo-router types these as `any`, so the bar declares the part it actually uses.
type TabBarProps = {
  state: TabNavigationState<Record<string, object | undefined>>;
  descriptors: Record<
    string,
    { options: { title?: string; tabBarIcon?: (props: IconProps) => ReactNode } }
  >;
  navigation: {
    emit(event: { type: 'tabPress'; target: string; canPreventDefault: true }): {
      defaultPrevented: boolean;
    };
    navigate(name: string): void;
  };
};

export function renderTabBar(area: Area) {
  return function render(props: TabBarProps) {
    return <TabBar {...props} area={area} />;
  };
}

export function tabIcon(Icon: LucideIcon) {
  return function render({ color }: IconProps) {
    return <Icon color={color} />;
  };
}

type Props = TabBarProps & { area: Area };

/** Bottom bar for the swipeable top-tab navigator, which only ships a top bar of its own. */
export function TabBar({ state, descriptors, navigation, area }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar[area],
          borderTopColor: colors.line.default,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.accent.base : colors.text.muted;
        const label = options.title ?? route.name;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <Tappable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.tab}
          >
            {options.tabBarIcon?.({ focused, color })}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: { fontFamily: fonts.medium, fontSize: 12 },
});
