import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { AppButton, AppText, Card, StatusBanner, TextField } from '@/components/ui';
import { useDemoFlags } from '@/demo/demo-provider';
import type { Show } from '@/domain/show';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

const maxCommentLength = 240;

export default function RateShowScreen() {
  const { playout } = useStations();
  const { ratingWindowClosed } = useDemoFlags();
  const colors = useTheme();
  const [show, setShow] = useState<Show | 'loading' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [comment, setComment] = useState('');
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

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Moderation bewerten" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
          <TextField
            label="Kommentar"
            optional
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder="Was war gut, was nicht?"
            maxLength={maxCommentLength}
          />
        ) : null}
      </ScrollView>
      {closed && (
        <View style={styles.footer}>
          <AppButton label="Zurück" variant="secondary" onPress={router.back} />
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
});
