import { duration } from '@/components/now-playing/now-playing-format';
import { useNowPlaying } from '@/components/now-playing/use-now-playing';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { AppText, Card } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { clockTime } from '@/components/wish/wish-format';
import { StyleSheet, View } from 'react-native';

export function NowPlayingBar() {
  const { state } = useNowPlaying();
  const now = useTickingNow();

  if (state.status !== 'live') {
    return (
      <Card>
        <AppText tone="muted">Lädt …</AppText>
      </Card>
    );
  }

  const track = state.snapshot.playing.track;
  const show = state.snapshot.playing.show;
  const startedAt = state.snapshot.playing.startedAt;

  const songEnd = startedAt.getTime() + (track.durationSec ?? 0) * 1000;
  const songRemaining = duration((songEnd - now.getTime()) / 1000);

  return (
    <Card style={styles.row}>
      <CoverPlaceholder seed={track.id} size={36} />

      <View style={styles.info}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {track.title} — {track.artist}
        </AppText>

        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {show.title} · bis {clockTime(show.endsAt)}
        </AppText>
      </View>

      <View style={styles.remaining}>
        <AppText variant="mono">{songRemaining}</AppText>
        <AppText variant="caption" tone="muted">
          Rest Titel
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  remaining: { alignItems: 'flex-end' },
});
