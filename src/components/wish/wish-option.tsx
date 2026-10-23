import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Tappable } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  /** Small line above the title, used for the free text card. */
  eyebrow?: string;
};

export function WishOption({ title, subtitle, selected, onPress, leading, eyebrow }: Props) {
  const colors = useTheme();

  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[eyebrow, title, subtitle].filter(Boolean).join(', ')}
      style={[
        styles.card,
        selected
          ? { borderColor: colors.accent.base, backgroundColor: colors.surface.raised }
          : { borderColor: colors.line.default, backgroundColor: colors.surface.default },
      ]}
    >
      {leading}
      <View style={styles.text}>
        {eyebrow && (
          <AppText variant="label" tone="muted">
            {eyebrow}
          </AppText>
        )}
        <AppText variant="headline" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle.length > 0 && (
          <AppText tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: 2 },
});
