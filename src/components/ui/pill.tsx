import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, touchTarget, useTheme } from '@/theme';

type Props = {
  label: string;
  active?: boolean;
  size?: 'small' | 'large';
  icon?: ReactNode;
  onPress?: () => void;
};

const heights = { small: 26, large: 36 };

export function Pill({ label, active = false, size = 'small', icon, onPress }: Props) {
  const colors = useTheme();
  const height = heights[size];
  const surface = active
    ? { backgroundColor: colors.accent.surface, borderColor: colors.accent.base }
    : { backgroundColor: 'transparent', borderColor: colors.line.default };
  const color = active ? colors.accent.text : colors.text.muted;

  const content = (
    <>
      {icon}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.pill, { height }, surface]}>{content}</View>;
  }

  const slop = Math.max(0, (touchTarget - height) / 2);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.pill, { height }, surface, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
  },
  label: { fontFamily: fonts.medium, fontSize: 12 },
  pressed: { opacity: 0.8 },
});
