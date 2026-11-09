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
  eyebrow?: string;
};

export function WishOption(props: Props) {
  const { title, subtitle, selected, onPress, leading, eyebrow } = props;
  const colors = useTheme();
  const accessibilityLabel = [eyebrow, title, subtitle].filter(Boolean).join(', ');
  const selectionStyle = selected
    ? { borderColor: colors.accent.base, backgroundColor: colors.surface.raised }
    : { borderColor: colors.line.default, backgroundColor: colors.surface.default };

  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.option, selectionStyle]}
    >
      {leading}
      <View style={styles.content}>
        {eyebrow ? (
          <AppText variant="label" tone="muted">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="headline" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle.length > 0 ? (
          <AppText tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: 2,
  },
});
