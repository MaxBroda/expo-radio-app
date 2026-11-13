import { AreaScreen } from '@/components/area-screen';
import { ActivityPlaceholder } from '@/components/studio/activity-placeholder';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { RatingCard } from '@/components/studio/rating-card';
import { RatingFilter, type Filter } from '@/components/studio/rating-filter';
import { useRatings } from '@/components/studio/use-ratings';
import { spacing } from '@/theme';

import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export default function TickerScreen() {
  const ratings = useRatings();
  const [filter, setFilter] = useState<Filter>('all');
  const shown =
    filter === 'all' ? ratings : ratings.filter((rating) => rating.subject.kind === filter);

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <ActivityPlaceholder />
      <RatingFilter ratings={ratings} selected={filter} onSelect={setFilter} />
      <FlatList
        data={shown}
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
