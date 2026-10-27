import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { AppText, Card, StatusBanner, TextField } from '@/components/ui';
import type { Show } from '@/domain/show';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, touchTarget, useTheme } from '@/theme';

const maxCommentLength = 240;

export default function RateShowScreen() {
  const { playout } = useStations();
  const colors = useTheme();
  const [show, setShow] = useState<Show | 'loading' | 'error'>('loading');
  const [comment, setComment] = useState('');

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
  }, [playout]);

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
          <StatusBanner tone="error" title="Sendung gerade nicht verfügbar" />
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
        {typeof show !== 'string' && show.hostName && (
          <TextField
            label="Kommentar"
            optional
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder="Was war gut, was nicht?"
            maxLength={maxCommentLength}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: screenPadding.listener, gap: spacing.lg },
  showCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  showDetails: { flex: 1, gap: spacing.xs },
  avatar: {
    width: touchTarget + spacing.md,
    height: touchTarget + spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
