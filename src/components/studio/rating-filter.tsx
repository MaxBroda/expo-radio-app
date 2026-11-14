import { Pill } from '@/components/ui';
import type { Rating } from '@/domain/rating';
import { StyleSheet, View } from 'react-native';

export type Filter = 'all' | 'track' | 'show';

type Props = {
  ratings: Rating[];
  selected: Filter;
  onSelect: (filter: Filter) => void;
};

export function RatingFilter({ ratings, selected, onSelect }: Props) {
  const all = ratings.length;
  const tracks = ratings.filter((rating) => rating.subject.kind === 'track').length;
  const shows = ratings.filter((rating) => rating.subject.kind === 'show').length;

  return (
    <View style={styles.pills}>
      <Pill
        label={`Alle ${all}`}
        size="large"
        active={selected === 'all'}
        onPress={() => onSelect('all')}
      />
      <Pill
        label={`Titel ${tracks}`}
        size="large"
        active={selected === 'track'}
        onPress={() => onSelect('track')}
      />
      <Pill
        label={`Moderation ${shows}`}
        size="large"
        active={selected === 'show'}
        onPress={() => onSelect('show')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
