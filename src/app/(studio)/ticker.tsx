import { AreaScreen } from '@/components/area-screen';
import { ActivityPlaceholder } from '@/components/studio/activity-placeholder';
import { CurrentSong } from '@/components/studio/current-song';
import { RatingCard } from '@/components/studio/rating-card';
import { RatingFilter } from '@/components/studio/rating-filter';
import { useRatings } from '@/components/studio/use-ratings';
import { spacing } from '@/theme';

import { FlatList, StyleSheet } from 'react-native';

export default function TickerScreen() {
  const ratings = useRatings();

  return (
    <AreaScreen area="studio">
      <CurrentSong />
      <ActivityPlaceholder />
      <RatingFilter />
      <FlatList
        data={ratings}
        renderItem={({ item }) => <RatingCard rating={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </AreaScreen>
  );
}
const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
