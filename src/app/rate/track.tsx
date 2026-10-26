import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppText, Card, StatusBanner, TextField } from '@/components/ui';
import type { Score } from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';
import { screenPadding, spacing } from '@/theme';

export default function RateTrackScreen() {
  const { playout } = useStations();
  const [playing, setPlaying] = useState<PlayedTrack | 'loading' | 'error'>('loading');
  const [score, setScore] = useState<Score>();
  const [comment, setComment] = useState('');

  useEffect(() => {
    let active = true;
    playout.getNowPlaying().then(
      (current) => {
        if (active) setPlaying(current);
      },
      () => {
        if (active) setPlaying('error');
      },
    );
    return () => {
      active = false;
    };
  }, [playout]);

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Playlist bewerten" />
      <View style={styles.content}>
        {playing === 'loading' ? (
          <Card accessible accessibilityRole="progressbar" accessibilityLabel="Titel wird geladen">
            <AppText tone="muted">Titel wird geladen …</AppText>
          </Card>
        ) : playing === 'error' ? (
          <StatusBanner tone="error" title="Titel gerade nicht verfügbar" />
        ) : (
          <Card>
            <AppText variant="headline">{playing.track.title}</AppText>
            <AppText tone="secondary">{playing.track.artist}</AppText>
            <AppText variant="mono" tone="muted">
              läuft seit{' '}
              {playing.startedAt.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </AppText>
          </Card>
        )}
        <AppText variant="headline">Wie findest du den Titel?</AppText>
        <RatingStars value={score} onChange={setScore} />
        <TextField
          label="Kommentar"
          optional
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder="Was war gut, was nicht?"
          maxLength={240}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: screenPadding.listener, gap: spacing.md },
});
