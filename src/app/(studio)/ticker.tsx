import { AreaScreen } from '@/components/area-screen';
import { ActivityPlaceholder } from '@/components/studio/activity-placeholder';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { RatingCard } from '@/components/studio/rating-card';
import { RatingFilter, type Filter } from '@/components/studio/rating-filter';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { useRatings } from '@/components/studio/use-ratings';
import { spacing } from '@/theme';

import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export default function TickerScreen() {
  const ratings = useRatings();
  const now = useTickingNow();
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
        renderItem={({ item }) => (
          <RatingCard
            rating={item}
            isNew={now.getTime() - item.createdAt.getTime() < 5 * 60 * 1000}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </AreaScreen>
  );
}
const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
