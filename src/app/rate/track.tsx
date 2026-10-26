import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppButton, AppText, Card, StatusBanner, TextField } from '@/components/ui';
import type { Score } from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';
import { screenPadding, spacing } from '@/theme';

const maxCommentLength = 240;

export default function RateTrackScreen() {
  const { playout, feedbackHub } = useStations();
  const [playing, setPlaying] = useState<PlayedTrack | 'loading' | 'error'>('loading');
  const [score, setScore] = useState<Score>();
  const [comment, setComment] = useState('');
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const submitLocked = useRef(false);
  const locked = submission === 'sending' || submission === 'sent';
  const canSubmit =
    typeof playing !== 'string' &&
    score !== undefined &&
    comment.length <= maxCommentLength &&
    !locked;

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

  async function submit() {
    if (
      typeof playing === 'string' ||
      score === undefined ||
      comment.length > maxCommentLength ||
      submitLocked.current
    ) {
      return;
    }
    submitLocked.current = true;
    setSubmission('sending');
    try {
      await feedbackHub.submitRating({
        score,
        subject: { kind: 'track', trackId: playing.track.id },
        comment: comment || undefined,
      });
      setSubmission('sent');
    } catch {
      submitLocked.current = false;
      setSubmission('error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Playlist bewerten" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        <RatingStars value={score} onChange={setScore} disabled={locked} />
        <TextField
          label="Kommentar"
          optional
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder="Was war gut, was nicht?"
          maxLength={maxCommentLength}
          disabled={locked}
        />
        {submission === 'error' && (
          <StatusBanner
            tone="error"
            title="Senden fehlgeschlagen"
            text="Deine Bewertung bleibt erhalten. Bitte versuche es noch einmal."
          />
        )}
        {submission === 'sent' && (
          <StatusBanner tone="success" title="Bewertung gesendet" text="Danke für dein Feedback." />
        )}
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          label={submission === 'sending' ? 'Wird gesendet …' : 'Bewertung absenden'}
          onPress={() => {
            void submit();
          }}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: screenPadding.listener, gap: spacing.md },
  footer: { padding: screenPadding.listener },
});
