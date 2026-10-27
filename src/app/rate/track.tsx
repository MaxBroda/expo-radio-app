import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppButton, AppText, Card, Pill, StatusBanner, TextField } from '@/components/ui';
import { AlreadyRatedError } from '@/domain/errors';
import type { Rating, Score } from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

const maxCommentLength = 240;

export default function RateTrackScreen() {
  const colors = useTheme();
  const { playout, feedbackHub } = useStations();
  const [playing, setPlaying] = useState<PlayedTrack | 'loading' | 'error'>('loading');
  const [score, setScore] = useState<Score>();
  const [comment, setComment] = useState('');
  const [submission, setSubmission] = useState<
    'idle' | 'sending' | 'error' | 'alreadyRated' | Rating
  >('idle');
  const submitLocked = useRef(false);
  const receipt = typeof submission === 'object' ? submission : undefined;
  const locked = submission === 'sending' || receipt !== undefined || submission === 'alreadyRated';
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
      const saved = await feedbackHub.submitRating({
        score,
        subject: { kind: 'track', trackId: playing.track.id },
        comment: comment || undefined,
      });
      setSubmission(saved);
    } catch (error) {
      if (error instanceof AlreadyRatedError) {
        setSubmission('alreadyRated');
        return;
      }
      submitLocked.current = false;
      setSubmission('error');
    }
  }

  if (receipt && typeof playing !== 'string') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.confirmation}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.accent.surface, borderColor: colors.accent.border },
            ]}
          >
            <Check size={spacing.xxxl} color={colors.accent.base} />
          </View>
          <AppText variant="display" accessibilityRole="header" style={styles.centered}>
            Danke, ist angekommen
          </AppText>
          <AppText tone="secondary" style={styles.centered} accessibilityLiveRegion="polite">
            Deine Bewertung wurde gesendet.
          </AppText>
          <Card style={styles.receipt}>
            <View style={styles.receiptHeader}>
              <Pill label={`${receipt.score}/5`} active />
              <Pill label="Titel" />
              <AppText variant="mono" tone="muted" style={styles.receiptTime}>
                {receipt.createdAt.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </AppText>
            </View>
            {receipt.comment ? <AppText>„{receipt.comment}“</AppText> : null}
            <AppText tone="muted">
              {playing.track.title} — {playing.track.artist}
            </AppText>
          </Card>
          <View style={styles.receipt}>
            <AppButton label="Fertig" onPress={router.back} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Playlist bewerten" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submission === 'error' && (
          <StatusBanner
            tone="error"
            title="Senden fehlgeschlagen"
            text="Deine Bewertung bleibt erhalten. Bitte versuche es noch einmal."
          />
        )}
        {playing === 'loading' ? (
          <Card accessible accessibilityRole="progressbar" accessibilityLabel="Titel wird geladen">
            <AppText tone="muted">Titel wird geladen …</AppText>
          </Card>
        ) : playing === 'error' ? (
          <StatusBanner tone="error" title="Titel gerade nicht verfügbar" />
        ) : (
          <Card style={styles.trackCard}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.cover, { backgroundColor: colors.surface.raised }]}
            >
              <View style={[styles.coverCircle, { backgroundColor: colors.accent.base }]} />
            </View>
            <View style={styles.trackDetails}>
              <AppText variant="headline">{playing.track.title}</AppText>
              <AppText tone="secondary">{playing.track.artist}</AppText>
              <AppText variant="mono" tone="muted">
                läuft seit{' '}
                {playing.startedAt.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </AppText>
            </View>
          </Card>
        )}
        {submission === 'alreadyRated' ? (
          <StatusBanner
            tone="info"
            title="Schon bewertet"
            text="Du hast diesen Titel bereits bewertet. Pro Titel zählt eine Stimme."
          />
        ) : (
          <>
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
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {submission === 'alreadyRated' ? (
          <AppButton label="Zurück" variant="secondary" onPress={router.back} />
        ) : (
          <AppButton
            label={
              submission === 'sending'
                ? 'Wird gesendet …'
                : submission === 'error'
                  ? 'Erneut senden'
                  : 'Bewertung absenden'
            }
            onPress={() => {
              void submit();
            }}
            disabled={!canSubmit}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: screenPadding.listener, gap: spacing.md },
  footer: { padding: screenPadding.listener },
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trackDetails: { flex: 1, gap: spacing.xs },
  cover: {
    width: touchTarget + spacing.md,
    height: touchTarget + spacing.md,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  coverCircle: {
    position: 'absolute',
    width: touchTarget + spacing.sm,
    height: touchTarget + spacing.sm,
    borderRadius: radius.pill,
    left: -spacing.sm,
    bottom: -spacing.md,
  },
  confirmation: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: screenPadding.listener,
    gap: spacing.xxl,
  },
  successIcon: {
    width: touchTarget * 2,
    height: touchTarget * 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  receipt: { width: '100%' },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  receiptTime: { marginLeft: 'auto' },
});
