import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { historyLength } from '@/components/history/use-history';
import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppButton, AppText, Card, Pill, StatusBanner, TextField } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { AlreadyRatedError } from '@/domain/errors';
import {
  ratingCommentMaxLength as maxCommentLength,
  type Rating,
  type Score,
} from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import type { Playout } from '@/ports/playout';
import { useStations } from '@/stations/stations-provider';
import { useRatingSubmission } from '@/stations/rating-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

type Target = PlayedTrack & { onAir: boolean };

/** Without params the current track; from the history the track that started at `startedAt`. */
async function findTarget(
  playout: Playout,
  trackId?: string,
  startedAt?: string,
): Promise<Target | undefined> {
  const matches = (played: PlayedTrack) =>
    played.track.id === trackId && played.startedAt.getTime() === Number(startedAt);
  const current = await playout.getNowPlaying();
  if (!trackId || matches(current)) return { ...current, onAir: true };
  const played = (await playout.getHistory(historyLength)).find(matches);
  return played && { ...played, onAir: false };
}

const coverSize = touchTarget + spacing.md;

export default function RateTrackScreen() {
  const colors = useTheme();
  const { playout } = useStations();
  const ratingSubmission = useRatingSubmission();
  const { trackId, startedAt } = useLocalSearchParams<{ trackId?: string; startedAt?: string }>();
  const [playing, setPlaying] = useState<Target | 'loading' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [ratedScore, setRatedScore] = useState<Score>();
  const [score, setScore] = useState<Score>();
  const [comment, setComment] = useState('');
  const [submission, setSubmission] = useState<
    'idle' | 'sending' | 'error' | 'alreadyRated' | 'storage' | 'demoChanged' | Rating
  >('idle');
  const [saveFailed, setSaveFailed] = useState(false);
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
    findTarget(playout, trackId, startedAt)
      .then(async (target) => {
        if (!target) throw new Error('track no longer in history');
        const score = await ratingSubmission
          .ratedScore({ kind: 'track', trackId: target.track.id })
          .catch(() => undefined);
        if (!active) return;
        setPlaying(target);
        if (score !== undefined) {
          setRatedScore(score);
          setSubmission('alreadyRated');
        }
      })
      .catch(() => {
        if (active) setPlaying('error');
      });
    return () => {
      active = false;
    };
  }, [playout, ratingSubmission, trackId, startedAt, attempt]);

  async function showAlreadyRated(subject: Target) {
    setRatedScore(
      await ratingSubmission
        .ratedScore({ kind: 'track', trackId: subject.track.id })
        .catch(() => undefined),
    );
    setSubmission('alreadyRated');
  }

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
      const result = await ratingSubmission.submit(
        { kind: 'track', trackId: playing.track.id },
        score,
        comment || undefined,
      );
      if (result.status === 'sent') {
        setSaveFailed(!result.remembered);
        setSubmission(result.rating);
      } else if (result.status === 'alreadyRated') {
        await showAlreadyRated(playing);
      } else if (result.status === 'awaitingLocalSave') {
        setSubmission('storage');
      } else if (result.status === 'demoChanged') {
        setSubmission('demoChanged');
      } else {
        submitLocked.current = false;
        setSubmission('error');
      }
    } catch (error) {
      if (error instanceof AlreadyRatedError) {
        await showAlreadyRated(playing);
        return;
      }
      submitLocked.current = false;
      setSubmission('error');
    }
  }

  async function retrySave() {
    if (await ratingSubmission.retryLocalSave()) {
      setSaveFailed(false);
      if (submission === 'storage') {
        submitLocked.current = false;
        setSubmission('idle');
      }
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
            {saveFailed ? (
              <>
                <StatusBanner
                  tone="error"
                  title="Bewertung gesendet"
                  text="Die lokale Speicherung hat nicht geklappt."
                />
                <AppButton
                  label="Speichern erneut versuchen"
                  onPress={() => {
                    void retrySave();
                  }}
                />
              </>
            ) : (
              <AppButton label="Fertig" onPress={router.back} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Titel bewerten" />
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
          <>
            <StatusBanner tone="error" title="Titel gerade nicht verfügbar" />
            <AppButton
              label="Erneut versuchen"
              variant="secondary"
              onPress={() => {
                setPlaying('loading');
                setAttempt((previous) => previous + 1);
              }}
            />
          </>
        ) : (
          <Card style={styles.trackCard}>
            <CoverPlaceholder seed={playing.track.id} size={coverSize} />
            <View style={styles.trackDetails}>
              <AppText variant="headline">{playing.track.title}</AppText>
              <AppText tone="secondary">{playing.track.artist}</AppText>
              <AppText variant="mono" tone="muted">
                {playing.onAir ? 'läuft seit' : 'gelaufen'}{' '}
                {playing.startedAt.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </AppText>
            </View>
          </Card>
        )}
        {submission === 'storage' ? (
          <StatusBanner
            tone="error"
            title="Speicherung ausstehend"
            text="Eine gesendete Bewertung muss noch gespeichert werden."
          />
        ) : submission === 'demoChanged' ? (
          <StatusBanner
            tone="info"
            title="Demo-Zeit geändert"
            text="Bitte öffne die Bewertung erneut."
          />
        ) : submission === 'alreadyRated' ? (
          <StatusBanner
            tone="info"
            title="Schon bewertet"
            text={`Pro Titel zählt eine Stimme, so bleibt das Stimmungsbild im Studio ehrlich.${
              ratedScore ? ` Deine Wertung: ${ratedScore} von 5.` : ''
            }`}
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
        {submission === 'storage' ? (
          <AppButton
            label="Speichern erneut versuchen"
            onPress={() => {
              void retrySave();
            }}
          />
        ) : submission === 'alreadyRated' || submission === 'demoChanged' ? (
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
