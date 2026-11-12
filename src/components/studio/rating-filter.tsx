import { Pill } from '@/components/ui';
import type { Rating } from '@/domain/rating';
import { StyleSheet, View } from 'react-native';

export function RatingFilter({ ratings }: { ratings: Rating[] }) {
  // !!! Add onClick functions
  const all = ratings.length;
  const tracks = ratings.filter((rating) => rating.subject.kind === 'track').length;
  const shows = ratings.filter((rating) => rating.subject.kind === 'show').length;

  return (
    <View style={styles.pills}>
      <Pill label={`Alle ${all}`} size="large" />
      <Pill label={`Titel ${tracks}`} size="large" />
      <Pill label={`Moderation ${shows}`} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
