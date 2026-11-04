import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText, Skeleton } from '@/components/ui';
import { quotaLine, trackLine } from '@/components/wish/wish-format';
import type { Track } from '@/domain/track';
import type { Wish } from '@/domain/wish';
import type { WishQuota } from '@/domain/wish-quota';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, useTheme } from '@/theme';

type Sent = { wish?: Wish; track?: Track; quota?: WishQuota; showTitle?: string };

export default function WishSentScreen() {
  const colors = useTheme();
  const { id, greeting } = useLocalSearchParams<{ id: string; greeting?: string }>();
  const { wishSystem, musicDatabase, playout } = useStations();
  const [sent, setSent] = useState<Sent | null>(null);

  useEffect(() => {
    let current = true;
    async function load(): Promise<Sent> {
      const [wishes, quota, showTitle] = await Promise.all([
        wishSystem.list(),
        wishSystem.quota(),
        playout.getNowPlaying().then(
          (nowPlaying) => nowPlaying.show.title,
          () => undefined,
        ),
      ]);
      const wish = wishes.find((w) => w.id === id);
      const track =
        wish?.song.kind === 'catalog' ? await musicDatabase.lookup(wish.song.trackId) : undefined;
      return { wish, track, quota, showTitle };
    }
    load().then(
      (result) => current && setSent(result),
      () => current && setSent({}),
    );
    return () => {
      current = false;
    };
  }, [id, wishSystem, musicDatabase, playout]);

  const wish = sent?.wish;
  const title = wish?.song.kind === 'freeText' ? 'Freitext-Wunsch' : sent?.track?.title;
  const subtitle =
    wish?.song.kind === 'freeText'
      ? `„${wish.song.description}“`
      : sent?.track
        ? trackLine(sent.track)
        : '';

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.check,
          { backgroundColor: colors.accent.surface, borderColor: colors.accent.border },
        ]}
      >
        <Check size={36} color={colors.accent.base} />
      </View>

      <View style={styles.heading}>
        <AppText variant="display" accessibilityRole="header" style={styles.center}>
          Wunsch ist im Studio
        </AppText>
        <AppText tone="secondary" style={styles.center}>
          {sent?.showTitle
            ? `Er steht jetzt auf der Wunschliste der ${sent.showTitle}.`
            : 'Er steht jetzt auf der Wunschliste.'}
        </AppText>
      </View>

      {sent === null ? (
        <Skeleton width="100%" height={150} radius={radius.lg} />
      ) : (
        wish && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface.default, borderColor: colors.line.default },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.votes}>
                <AppText variant="title">{wish.votes}</AppText>
                <AppText variant="caption" tone="muted">
                  {wish.votes === 1 ? 'Stimme' : 'Stimmen'}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="headline">{title}</AppText>
                <AppText tone="secondary">{subtitle}</AppText>
              </View>
            </View>
            {greeting ? (
              <AppText style={{ color: colors.data.text }}>Gruß: „{greeting}“</AppText>
            ) : null}
            {sent.quota && (
              <View style={[styles.divider, { borderTopColor: colors.line.default }]}>
                <AppText tone="secondary">{quotaLine(sent.quota)}</AppText>
              </View>
            )}
          </View>
        )
      )}

      <AppButton label="Fertig" onPress={() => router.back()} style={styles.done} />
      <AppText variant="caption" tone="muted" style={styles.center}>
        Nur in dieser Demo: über den Schalter DEMO oben wechselst du ins Studio und siehst die
        Wunschliste.
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
    padding: screenPadding.listener,
  },
  check: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: spacing.sm },
  center: { textAlign: 'center' },
  card: {
    alignSelf: 'stretch',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  row: { flexDirection: 'row', gap: spacing.lg },
  votes: { alignItems: 'center', minWidth: 48 },
  flex: { flex: 1, gap: 2 },
  divider: { paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  done: { alignSelf: 'stretch' },
});
