import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { useWishes } from '@/components/studio/use-wishes';
import { WishCard } from '@/components/studio/wish-card';
import { WishSort, type Sort } from '@/components/studio/wish-sort';
import { WishSummary } from '@/components/studio/wish-summary';
import { spacing } from '@/theme';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export default function WishesScreen() {
  const { wishes, setStatus } = useWishes();
  const [sort, setSort] = useState<Sort>('votes');

  const sortedWishes = [...wishes];

  if (sort === 'votes') {
    sortedWishes.sort((a, b) => b.votes - a.votes);
  } else {
    sortedWishes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <WishSummary wishes={wishes} />
      <WishSort selected={sort} onSelect={setSort} />
      <FlatList
        data={sortedWishes}
        renderItem={({ item }) => (
          <WishCard wish={item} onSetStatus={(status) => setStatus(item.id, status)} />
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
