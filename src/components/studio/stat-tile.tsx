import { AppText, Card } from '@/components/ui';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';

type Props = {
  label: string;
  value: string;
  unit: string;
  color: string;
};

export function StatTile({ label, value, unit, color }: Props) {
  return (
    <Card style={styles.tile}>
      <AppText tone="muted">{label}</AppText>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <AppText variant="display">{value}</AppText>
        <AppText tone="muted">{unit}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  dot: { width: 10, height: 10 },
});
