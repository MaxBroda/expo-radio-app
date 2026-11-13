import type { Rating } from '@/domain/rating';
import { spacing, useTheme } from '@/theme';
import { calculateMood } from '@/domain/mood';
import { AppText, Card, Pill } from '@/components/ui';
import { StyleSheet, View } from 'react-native';
import { clockTime } from '@/components/wish/wish-format';

function decimal(value: number) {
  return value.toFixed(1).replace('.', ',');
}

export function MoodCard({ ratings, now }: { ratings: Rating[]; now: Date }) {
  const colors = useTheme();
  const { from, to, recent, average, trend } = calculateMood(ratings, now);

  const averageLabel = average === undefined ? '–' : decimal(average);
  let trendLabel = '';
  if (trend !== undefined) {
    trendLabel = trend >= 0 ? `↑ +${decimal(trend)}` : `↓ ${decimal(trend)}`;
  }

  function barColor(score: number) {
    if (score >= 4) return colors.data.base;
    if (score === 3) return colors.line.strong;
    return colors.critical.base;
  }

  return (
    <Card>
      <View style={styles.header}>
        <AppText variant="overline" tone="muted">
          Stimmung
        </AppText>
        <AppText variant="caption" tone="muted">
          Ø letzte 15 Min
        </AppText>
      </View>

      <View style={styles.header}>
        <View style={styles.average}>
          <AppText variant="display" tone="data">
            {averageLabel}
          </AppText>
          <AppText tone="muted">von 5</AppText>
        </View>
        {trendLabel !== '' && <Pill label={trendLabel} />}
      </View>

      <View style={styles.bars}>
        {recent.map((rating) => (
          <View
            key={rating.id}
            style={[
              styles.bar,
              { height: rating.score * 12, backgroundColor: barColor(rating.score) },
            ]}
          />
        ))}
      </View>

      <View style={styles.header}>
        <AppText variant="mono" tone="muted">
          {clockTime(from)}
        </AppText>
        <AppText variant="mono" tone="muted">
          {recent.length} Bewertungen
        </AppText>
        <AppText variant="mono" tone="muted">
          {clockTime(to)}
        </AppText>
      </View>

      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.data.base }]} />
        <AppText variant="caption" tone="muted">
          4–5
        </AppText>
        <View style={[styles.dot, { backgroundColor: colors.line.strong }]} />
        <AppText variant="caption" tone="muted">
          3
        </AppText>
        <View style={[styles.dot, { backgroundColor: colors.critical.base }]} />
        <AppText variant="caption" tone="muted">
          1–2
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  average: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 60 },
  bar: { flex: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10 },
});
