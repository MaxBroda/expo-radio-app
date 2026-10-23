import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { WishQuota } from '@/domain/wish-quota';
import { radius, spacing, useTheme } from '@/theme';

import { quotaLine } from './wish-format';

export function QuotaMeter({ quota }: { quota: WishQuota }) {
  const colors = useTheme();

  return (
    <View style={styles.row} accessible accessibilityLabel={quotaLine(quota)}>
      <View style={styles.segments}>
        {Array.from({ length: quota.limit }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < quota.remaining ? colors.accent.base : colors.line.strong },
            ]}
          />
        ))}
      </View>
      <AppText variant="label" tone="secondary" style={styles.text}>
        {quotaLine(quota)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segments: { flexDirection: 'row', gap: spacing.xs },
  segment: { width: 18, height: 4, borderRadius: radius.pill },
  text: { flex: 1 },
});
