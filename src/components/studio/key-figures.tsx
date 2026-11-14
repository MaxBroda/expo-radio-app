import type { Rating } from '@/domain/rating';
import type { Wish } from '@/domain/wish';
import { spacing, useTheme } from '@/theme';
import { average, calculateMood } from '@/domain/mood';
import { StyleSheet, View } from 'react-native';
import { StatTile } from '@/components/studio/stat-tile';
import { decimal } from '@/components/studio/mood-card';

type Props = {
  ratings: Rating[];
  wishes: Wish[];
  now: Date;
};

export function KeyFigures({ ratings, wishes, now }: Props) {
  const colors = useTheme();
  const { recent } = calculateMood(ratings, now);

  const trackAverage = average(recent.filter((rating) => rating.subject.kind === 'track'));
  const showAverage = average(recent.filter((rating) => rating.subject.kind === 'show'));
  const today = ratings.filter(
    (rating) => rating.createdAt.toDateString() === now.toDateString(),
  ).length;
  const openWishes = wishes.filter((wish) => wish.status === 'open').length;

  function averageColor(value: number | undefined) {
    if (value === undefined) return colors.line.strong;
    if (value >= 4) return colors.data.base;
    if (value >= 3) return colors.line.strong;
    return colors.critical.base;
  }

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile
          label="Ø Titel"
          value={trackAverage === undefined ? '–' : decimal(trackAverage)}
          unit="von 5"
          color={averageColor(trackAverage)}
        />
        <StatTile
          label="Ø Moderation"
          value={showAverage === undefined ? '–' : decimal(showAverage)}
          unit="von 5"
          color={averageColor(showAverage)}
        />
      </View>
      <View style={styles.row}>
        <StatTile
          label="Bewertungen heute"
          value={`${today}`}
          unit="gesamt"
          color={colors.accent.base}
        />
        <StatTile
          label="Offene Wünsche"
          value={`${openWishes}`}
          unit="in der Liste"
          color={colors.accent.base}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
