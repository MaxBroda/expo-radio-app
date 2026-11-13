import type { Wish, WishId, WishStatus } from '@/domain/wish';
import { StyleSheet, View } from 'react-native';
import { AppText, Pill } from '@/components/ui';
import { router } from 'expo-router';
import { WishCard } from '@/components/studio/wish-card';
import { spacing } from '@/theme';

type Props = {
  wishes: Wish[];
  onSetStatus: (id: WishId, status: WishStatus) => void;
};

export function TopWish({ wishes, onSetStatus }: Props) {
  const openWishes = wishes.filter((wish) => wish.status === 'open');
  openWishes.sort((a, b) => b.votes - a.votes);
  const top = openWishes[0];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="overline" tone="muted">
          Top-Wunsch
        </AppText>
        <Pill label="ganze Liste" size="large" onPress={() => router.navigate('/wishes')} />
      </View>

      {top && <WishCard wish={top} onSetStatus={(status) => onSetStatus(top.id, status)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
