import { useWishTrack } from '@/components/studio/use-wish-track';
import { AppButton, AppText, Card, Pill } from '@/components/ui';
import { trackLine } from '@/components/wish/wish-format';
import type { Wish, WishStatus } from '@/domain/wish';
import { spacing } from '@/theme';
import { StyleSheet, View } from 'react-native';

const statusLabel = { open: 'offen', accepted: 'übernommen', rejected: 'abgelehnt' };

type Props = {
  wish: Wish;
  onSetStatus: (status: WishStatus) => void;
};

export function WishCard({ wish, onSetStatus }: Props) {
  const track = useWishTrack(wish.song);

  const title = wish.song.kind === 'catalog' ? (track?.title ?? '') : 'Freitext-Wunsch';
  const details =
    wish.song.kind === 'catalog' ? (track ? trackLine(track) : '') : `„${wish.song.description}“`;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.votes}>
          <AppText variant="headline">{wish.votes}</AppText>
          <AppText variant="caption" tone="muted">
            Stimmen
          </AppText>
        </View>

        <View style={styles.info}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText tone="muted">{details}</AppText>
          {wish.greeting && <AppText tone="data">Gruß: „{wish.greeting}“</AppText>}
        </View>

        <Pill label={statusLabel[wish.status]} active={wish.status === 'accepted'} />
      </View>

      {wish.status === 'open' && (
        <View style={styles.buttons}>
          <AppButton
            label="übernehmen"
            size="compact"
            onPress={() => onSetStatus('accepted')}
            style={styles.button}
          />
          <AppButton
            label="ablehnen"
            size="compact"
            variant="secondary"
            onPress={() => onSetStatus('rejected')}
            style={styles.button}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  votes: { alignItems: 'center' },
  info: { flex: 1 },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1 },
});
