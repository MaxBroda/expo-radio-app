import type { Rating } from '@/domain/rating';
import { StyleSheet, View } from 'react-native';
import { AppText, Pill } from '@/components/ui';
import { router } from 'expo-router';
import { RatingCard } from '@/components/studio/rating-card';
import { spacing } from '@/theme';

export function LatestRating({ ratings, now }: { ratings: Rating[]; now: Date }) {
  const sortedRatings = [...ratings];
  sortedRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const latest = sortedRatings[0];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="overline" tone="muted">
          Zuletzt eingegangen
        </AppText>
        <Pill label="alle im Ticker" size="large" onPress={() => router.navigate('/ticker')} />
      </View>

      {latest && (
        <RatingCard
          rating={latest}
          isNew={now.getTime() - latest.createdAt.getTime() < 5 * 60 * 1000}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
