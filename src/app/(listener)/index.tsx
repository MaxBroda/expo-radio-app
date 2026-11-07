import { router } from 'expo-router';
import { CircleAlert, RotateCw } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AreaScreen } from '@/components/area-screen';
import { ConnectionPill } from '@/components/now-playing/connection-pill';
import { minutesAgo } from '@/components/now-playing/now-playing-format';
import { ShowCard } from '@/components/now-playing/show-card';
import { EmptyProgress, TrackProgress } from '@/components/now-playing/track-progress';
import { useNowPlaying, type Snapshot } from '@/components/now-playing/use-now-playing';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { AppButton, AppText, Card, Skeleton, StatusBanner } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { clockTime } from '@/components/wish/wish-format';
import { radius, spacing, useTheme } from '@/theme';

const coverSize = 280;

export default function NowPlayingScreen() {
  const colors = useTheme();
  const { state, retry } = useNowPlaying();
  const now = useTickingNow();

  return (
    <AreaScreen area="listener" status={<ConnectionPill status={state.status} now={now} />}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {state.status === 'connecting' && <LoadingState />}
        {state.status === 'live' && <LiveState snapshot={state.snapshot} now={now} />}
        {state.status === 'offline' && (
          <>
            <StatusBanner
              tone="error"
              title="Keine Verbindung zum Sender"
              text={
                state.last
                  ? `Letzter bekannter Stand — zuletzt aktualisiert ${minutesAgo(state.last.fetchedAt, now)}.`
                  : 'Sobald die Verbindung steht, siehst du hier, was läuft.'
              }
              icon={<CircleAlert size={20} color={colors.critical.text} />}
            />
            {state.last && <OfflineTrack snapshot={state.last} />}
          </>
        )}
      </ScrollView>
      <View style={styles.actions}>
        {state.status === 'connecting' && (
          <>
            <Skeleton width="100%" height={52} radius={radius.lg} />
            <Skeleton width="100%" height={52} radius={radius.lg} />
          </>
        )}
        {state.status === 'live' && (
          <>
            <AppButton label="Titel bewerten" onPress={() => router.push('/rate/track')} />
            <AppButton
              label="Song wünschen"
              variant="secondary"
              onPress={() => router.push('/wish')}
            />
          </>
        )}
        {state.status === 'offline' && (
          <>
            <AppButton
              label="Erneut verbinden"
              icon={<RotateCw size={18} color={colors.accent.ink} />}
              onPress={retry}
            />
            <AppButton
              label="Bewerten offline nicht möglich"
              variant="secondary"
              disabled
              onPress={() => {}}
            />
          </>
        )}
      </View>
    </AreaScreen>
  );
}

function LiveState({ snapshot: { playing }, now }: { snapshot: Snapshot; now: Date }) {
  const { track } = playing;
  const albumLine = [track.album, track.year?.toString()].filter(Boolean).join(' · ');

  return (
    <>
      <View style={styles.cover}>
        <CoverPlaceholder seed={track.id} size={coverSize} />
      </View>
      <View style={styles.titles}>
        <AppText variant="display" accessibilityRole="header">
          {track.title}
        </AppText>
        <AppText variant="headline" tone="secondary">
          {track.artist}
        </AppText>
        {albumLine !== '' && (
          <AppText variant="mono" tone="muted">
            {albumLine}
          </AppText>
        )}
      </View>
      {track.durationSec !== undefined ? (
        <TrackProgress startedAt={playing.startedAt} durationSec={track.durationSec} now={now} />
      ) : (
        <EmptyProgress />
      )}
      <ShowCard show={playing.show} onRate={() => router.push('/rate/show')} />
    </>
  );
}

function OfflineTrack({ snapshot: { playing, fetchedAt } }: { snapshot: Snapshot }) {
  return (
    <>
      <View style={[styles.cover, styles.dimmed]}>
        <CoverPlaceholder seed={playing.track.id} size={coverSize - 40} />
      </View>
      <View style={styles.titles}>
        <AppText variant="display" tone="secondary">
          {playing.track.title}
        </AppText>
        <AppText variant="headline" tone="muted">
          {playing.track.artist}
        </AppText>
        <AppText variant="mono" tone="muted">
          Stand {clockTime(fetchedAt)} · Laufzeit unbekannt
        </AppText>
      </View>
      <EmptyProgress />
    </>
  );
}

function LoadingState() {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Titel wird geladen">
      <View style={styles.content}>
        <View style={styles.cover}>
          <Skeleton width={coverSize} height={coverSize} radius={radius.lg} />
        </View>
        <View style={styles.titles}>
          <Skeleton width="68%" height={24} />
          <Skeleton width="44%" height={16} />
          <Skeleton width="54%" height={12} />
        </View>
        <Skeleton width="100%" height={4} />
        <Card style={styles.loadingCard}>
          <Skeleton width={44} height={44} radius={radius.pill} />
          <View style={styles.loadingLines}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="85%" height={12} />
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  cover: { alignItems: 'center' },
  dimmed: { opacity: 0.45 },
  titles: { gap: spacing.xs },
  actions: { gap: spacing.md },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadingLines: { flex: 1, gap: spacing.sm },
});
