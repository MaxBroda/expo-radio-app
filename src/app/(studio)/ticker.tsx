import { AreaScreen } from '@/components/area-screen';
import { ActivityPlaceholder } from '@/components/studio/activity-placeholder';
import { CurrentSong } from '@/components/studio/current-song';
import { RatingCard } from '@/components/studio/rating-card';
import { RatingFilter } from '@/components/studio/rating-filter';

import type { Rating, RatingId } from '@/domain/rating';
import type { TrackId } from '@/domain/track';

import { FlatList, StyleSheet } from 'react-native';

export default function TickerScreen() {
  // !!! implement actual data call of ratings
  const placeholderRatings: Rating[] = [
    {
      id: 'r1' as RatingId,
      score: 5,
      comment: 'super Song',
      subject: { kind: 'track', trackId: 't1' as TrackId },
      createdAt: new Date(),
    },
    {
      id: 'r2' as RatingId,
      score: 2,
      subject: { kind: 'track', trackId: 't2' as TrackId },
      createdAt: new Date(),
    },
  ];

  return (
    <AreaScreen area="studio">
      <CurrentSong />
      <ActivityPlaceholder />
      <RatingFilter />
      <FlatList data={placeholderRatings} renderItem={({ item }) => <RatingCard rating={item} />} />
    </AreaScreen>
  );
}
const styles = StyleSheet.create({
  list: { gap: 8 },
});
