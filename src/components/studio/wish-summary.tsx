import { AppText, Card } from '@/components/ui';
import type { Wish } from '@/domain/wish';
import { spacing, useTheme } from '@/theme';
import { StyleSheet, View } from 'react-native';

export function WishSummary({ wishes }: { wishes: Wish[] }) {
  const colors = useTheme();

  const open = wishes.filter((wish) => wish.status === 'open').length;
  const accepted = wishes.filter((wish) => wish.status === 'accepted').length;
  const rejected = wishes.filter((wish) => wish.status === 'rejected').length;

  return (
    <Card style={styles.row}>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.text.secondary }]} />
        <AppText variant="bodyStrong">{open}</AppText>
        <AppText tone="muted">offen</AppText>
      </View>

      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.accent.base }]} />
        <AppText variant="bodyStrong">{accepted}</AppText>
        <AppText tone="muted">übernommen</AppText>
      </View>

      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.line.strong }]} />
        <AppText variant="bodyStrong">{rejected}</AppText>
        <AppText tone="muted">abgelehnt</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10 },
});
