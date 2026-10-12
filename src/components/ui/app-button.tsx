import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { fonts, radius, spacing, useTheme, type Colors } from '@/theme';

type Variant = 'primary' | 'secondary';
type Size = 'regular' | 'compact';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function surfaceStyle(colors: Colors, variant: Variant, disabled: boolean): ViewStyle {
  if (disabled) {
    return { backgroundColor: colors.surface.disabled, borderColor: colors.surface.disabled };
  }
  return variant === 'primary'
    ? { backgroundColor: colors.accent.base, borderColor: colors.accent.base }
    : { backgroundColor: 'transparent', borderColor: colors.line.strong };
}

function labelColor(colors: Colors, variant: Variant, disabled: boolean): string {
  if (disabled) return colors.text.disabled;
  return variant === 'primary' ? colors.accent.ink : colors.text.default;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  icon,
  accessibilityLabel,
  style,
}: Props) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        surfaceStyle(colors, variant, disabled),
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          size === 'regular' ? styles.labelRegular : styles.labelCompact,
          { color: labelColor(colors, variant, disabled) },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  regular: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.xl },
  compact: { minHeight: 44, borderRadius: radius.sm, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.8 },
  labelRegular: { fontFamily: fonts.semibold, fontSize: 16 },
  labelCompact: { fontFamily: fonts.semibold, fontSize: 13 },
});
