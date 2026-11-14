import { AppText, Pill } from '@/components/ui';
import { spacing } from '@/theme';
import { StyleSheet, View } from 'react-native';

export type Sort = 'votes' | 'new';

type Props = {
  selected: Sort;
  onSelect: (sort: Sort) => void;
};

export function WishSort({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="overline" tone="muted">
        Sortierung
      </AppText>

      <View style={styles.pills}>
        <Pill
          label="meistgewünscht"
          size="large"
          active={selected === 'votes'}
          onPress={() => onSelect('votes')}
        />
        <Pill
          label="neu"
          size="large"
          active={selected === 'new'}
          onPress={() => onSelect('new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', gap: spacing.sm },
});
