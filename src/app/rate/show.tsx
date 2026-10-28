import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppButton, AppText, Card, Pill, StatusBanner, TextField } from '@/components/ui';
import { useDemoFlags } from '@/demo/demo-provider';
import type { Rating, Score } from '@/domain/rating';
import type { Show } from '@/domain/show';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

const maxCommentLength = 240;

export default function RateShowScreen() {
  const { playout, feedbackHub } = useStations();
  const { ratingWindowClosed } = useDemoFlags();
  const colors = useTheme();
  const [show, setShow] = useState<Show | 'loading' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [comment, setComment] = useState('');
  const [score, setScore] = useState<Score>();
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'error' | Rating>('idle');
  const submitLocked = useRef(false);
  const receipt = typeof submission === 'object' ? submission : undefined;
  const closed = typeof show !== 'string' && !!show.hostName && ratingWindowClosed;

  useEffect(() => {
    let active = true;
    playout.getNowPlaying().then(
      (current) => {
        if (active) setShow(current.show);
      },
      () => {
        if (active) setShow('error');
      },
    );
    return () => {
      active = false;
    };
  }, [playout, attempt]);

  async function submit() {
    if (
      typeof show === 'string' ||
      !show.hostName ||
      closed ||
      score === undefined ||
      submitLocked.current
    )
      return;
    submitLocked.current = true;
    setSubmission('sending');
    try {
      const result = await feedbackHub.submitRating({
        score,
        subject: { kind: 'show', showId: show.id },
        comment: comment || undefined,
      });
      setSubmission(result);
    } catch {
      submitLocked.current = false;
      setSubmission('error');
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
            <AppButton label="Fertig" onPress={router.back} />
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
        {closed ? (
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
      {closed && (
        <View style={styles.footer}>
          <AppButton label="Zurück" variant="secondary" onPress={router.back} />
        </View>
      )}
      {!closed && typeof show !== 'string' && !!show.hostName && (
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
            disabled={score === undefined || submission === 'sending'}
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
