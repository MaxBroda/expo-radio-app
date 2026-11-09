import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppButton, AppText, Card, Pill, StatusBanner, TextField } from '@/components/ui';
import { useDemoFlags } from '@/demo/demo-provider';
import {
  ratingCommentMaxLength as maxCommentLength,
  type Rating,
  type Score,
} from '@/domain/rating';
import type { Show } from '@/domain/show';
import { useStations } from '@/stations/stations-provider';
import { useRatingSubmission } from '@/stations/rating-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

export default function RateShowScreen() {
  const { listener } = useDemoFlags();
  return <RateShowForm key={listener} />;
}

function RateShowForm() {
  const { playout } = useStations();
  const ratingSubmission = useRatingSubmission();
  const { ratingWindowClosed } = useDemoFlags();
  const colors = useTheme();
  const [show, setShow] = useState<Show | 'loading' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [comment, setComment] = useState('');
  const [score, setScore] = useState<Score>();
  const [ratedScore, setRatedScore] = useState<Score>();
  const [submission, setSubmission] = useState<
    | 'idle'
    | 'sending'
    | 'error'
    | 'alreadyRated'
    | 'windowClosed'
    | 'storage'
    | 'demoChanged'
    | Rating
  >('idle');
  const [saveFailed, setSaveFailed] = useState(false);
  const submitLocked = useRef(false);
  const receipt = typeof submission === 'object' ? submission : undefined;
  const closed =
    typeof show !== 'string' &&
    !!show.hostName &&
    (ratingWindowClosed || submission === 'windowClosed');

  useEffect(() => {
    let active = true;
    playout
      .getNowPlaying()
      .then(async ({ show: current }) => {
        const rated = await ratingSubmission
          .ratedScore({ kind: 'show', showId: current.id })
          .catch(() => undefined);
        if (!active) return;
        setShow(current);
        if (rated !== undefined) {
          setRatedScore(rated);
          setSubmission('alreadyRated');
        }
      })
      .catch(() => {
        if (active) setShow('error');
      });
    return () => {
      active = false;
    };
  }, [playout, ratingSubmission, attempt]);

  async function submit() {
    if (
      typeof show === 'string' ||
      !show.hostName ||
      closed ||
      score === undefined ||
      comment.length > maxCommentLength ||
      submitLocked.current
    )
      return;
    submitLocked.current = true;
    setSubmission('sending');
    try {
      const result = await ratingSubmission.submit(
        { kind: 'show', show },
        score,
        comment || undefined,
      );
      if (result.status === 'sent') {
        setSaveFailed(!result.remembered);
        setSubmission(result.rating);
      } else if (result.status === 'alreadyRated') {
        setRatedScore(
          await ratingSubmission
            .ratedScore({ kind: 'show', showId: show.id })
            .catch(() => undefined),
        );
        setSubmission('alreadyRated');
      } else if (result.status === 'windowClosed' || result.status === 'demoChanged') {
        setSubmission(result.status);
      } else if (result.status === 'awaitingLocalSave') {
        setSubmission('storage');
      } else {
        submitLocked.current = false;
        setSubmission('error');
      }
    } catch {
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

  if (receipt && typeof show !== 'string') {
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
              <Pill label="Moderation" />
              <AppText variant="mono" tone="muted" style={styles.receiptTime}>
                {receipt.createdAt.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </AppText>
            </View>
            {receipt.comment ? <AppText>„{receipt.comment}“</AppText> : null}
            <AppText tone="muted">
              {show.hostName} — {show.title}
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
      <ModalHeader title="Moderation bewerten" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submission === 'error' && (
          <StatusBanner
            tone="error"
            title="Senden fehlgeschlagen"
            text="Deine Bewertung bleibt erhalten. Bitte versuche es noch einmal."
          />
        )}
        {show === 'loading' ? (
          <Card
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Sendung wird geladen"
          >
            <AppText tone="muted">Sendung wird geladen …</AppText>
          </Card>
        ) : show === 'error' ? (
          <>
            <StatusBanner tone="error" title="Sendung gerade nicht verfügbar" />
            <AppButton
              label="Erneut versuchen"
              variant="secondary"
              onPress={() => {
                setShow('loading');
                setAttempt((previous) => previous + 1);
              }}
            />
          </>
        ) : (
          <Card style={styles.showCard}>
            {show.hostName && (
              <View
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.avatar, { backgroundColor: colors.data.surface }]}
              >
                <AppText variant="headline" tone="data">
                  {show.hostName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join('')}
                </AppText>
              </View>
            )}
            <View style={styles.showDetails}>
              <AppText variant="headline">{show.hostName ?? 'Keine Moderation'}</AppText>
              <AppText tone="secondary">{show.title}</AppText>
              <AppText variant="mono" tone="muted">
                {show.startsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {show.endsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
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
            text={`Du hast diese Sendung bereits bewertet.${
              ratedScore ? ` Deine Wertung: ${ratedScore} von 5.` : ''
            }`}
          />
        ) : closed ? (
          <StatusBanner
            tone="info"
            title="Bewertungsfenster geschlossen"
            text="Die Moderation kann nur während der Sendung bewertet werden."
          />
        ) : typeof show !== 'string' && show.hostName ? (
          <>
            <RatingStars value={score} onChange={setScore} disabled={submission === 'sending'} />
            <TextField
              label="Kommentar"
              optional
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder="Was war gut, was nicht?"
              maxLength={maxCommentLength}
              disabled={submission === 'sending'}
            />
          </>
        ) : null}
      </ScrollView>
      {submission === 'storage' && (
        <View style={styles.footer}>
          <AppButton
            label="Speichern erneut versuchen"
            onPress={() => {
              void retrySave();
            }}
          />
        </View>
      )}
      {(closed || submission === 'alreadyRated' || submission === 'demoChanged') && (
        <View style={styles.footer}>
          <AppButton label="Zurück" variant="secondary" onPress={router.back} />
        </View>
      )}
      {!closed &&
        submission !== 'storage' &&
        submission !== 'alreadyRated' &&
        submission !== 'demoChanged' &&
        typeof show !== 'string' &&
        !!show.hostName && (
          <View style={styles.footer}>
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
              disabled={
                score === undefined || comment.length > maxCommentLength || submission === 'sending'
              }
            />
          </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: screenPadding.listener, gap: spacing.lg },
  showCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  showDetails: { flex: 1, gap: spacing.xs },
  footer: { padding: screenPadding.listener },
  avatar: {
    width: touchTarget + spacing.md,
    height: touchTarget + spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
