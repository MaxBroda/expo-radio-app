import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { WishQuota } from '@/domain/wish-quota';
import { radius, spacing, useTheme } from '@/theme';

import { quotaLine } from './wish-format';

type Props = {
  quota: WishQuota;
};

export function QuotaMeter({ quota }: Props) {
  const colors = useTheme();
  const label = quotaLine(quota);
  const segments = Array.from({ length: quota.limit }, (_, index) => {
    const available = index < quota.remaining;

    return (
      <View
        key={index}
        style={[
          styles.segment,
          { backgroundColor: available ? colors.accent.base : colors.line.strong },
        ]}
      />
    );
  });

  return (
    <View style={styles.container} accessible accessibilityLabel={label}>
      <View style={styles.segments}>{segments}</View>
      <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    width: 18,
    height: 4,
    borderRadius: radius.pill,
  },
  label: {
    flex: 1,
  },
});
