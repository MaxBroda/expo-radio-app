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
import type { MusicDatabase } from '@/ports/music-database';
import type { Playout } from '@/ports/playout';
import type { WishSystem } from '@/ports/wish-system';
import { useStations } from '@/stations/stations-provider';
import { radius, screenPadding, spacing, useTheme } from '@/theme';

type SentData = {
  wish?: Wish;
  track?: Track;
  quota?: WishQuota;
  showTitle?: string;
};

async function loadSentData(
  id: string,
  wishSystem: WishSystem,
  musicDatabase: MusicDatabase,
  playout: Playout,
): Promise<SentData> {
  const [wishes, quota, showTitle] = await Promise.all([
    wishSystem.list(),
    wishSystem.quota(),
    playout.getNowPlaying().then(
      ({ show }) => show.title,
      () => undefined,
    ),
  ]);

  const wish = wishes.find((candidate) => candidate.id === id);
  const track =
    wish?.song.kind === 'catalog' ? await musicDatabase.lookup(wish.song.trackId) : undefined;

  return { wish, track, quota, showTitle };
}

export default function WishSentScreen() {
  const colors = useTheme();
  const { id, greeting } = useLocalSearchParams<{ id: string; greeting?: string }>();
  const { wishSystem, musicDatabase, playout } = useStations();
  const [data, setData] = useState<SentData | null>(null);

  useEffect(() => {
    let active = true;

    loadSentData(id, wishSystem, musicDatabase, playout).then(
      (loaded) => {
        if (active) {
          setData(loaded);
        }
      },
      () => {
        if (active) {
          setData({});
        }
      },
    );

    return () => {
      active = false;
    };
  }, [id, musicDatabase, playout, wishSystem]);

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.confirmation,
          {
            backgroundColor: colors.accent.surface,
            borderColor: colors.accent.border,
          },
        ]}
      >
        <Check size={36} color={colors.accent.base} />
      </View>

      <View style={styles.heading}>
        <AppText variant="display" accessibilityRole="header" style={styles.centered}>
          Wunsch ist im Studio
        </AppText>
        <AppText tone="secondary" style={styles.centered}>
          {data?.showTitle
            ? `Er steht jetzt auf der Wunschliste der ${data.showTitle}.`
            : 'Er steht jetzt auf der Wunschliste.'}
        </AppText>
      </View>

      {data === null ? (
        <Skeleton width="100%" height={150} radius={radius.lg} />
      ) : data.wish ? (
        <SentWishCard wish={data.wish} track={data.track} quota={data.quota} greeting={greeting} />
      ) : null}

      <AppButton label="Fertig" onPress={() => router.back()} style={styles.done} />
      <AppText variant="caption" tone="muted" style={styles.centered}>
        Nur in dieser Demo: über den Schalter DEMO oben wechselst du ins Studio und siehst die
        Wunschliste.
      </AppText>
    </SafeAreaView>
  );
}

type CardProps = {
  wish: Wish;
  track?: Track;
  quota?: WishQuota;
  greeting?: string;
};

function SentWishCard({ wish, track, quota, greeting }: CardProps) {
  const colors = useTheme();
  let title: string | undefined;
  let subtitle: string;

  if (wish.song.kind === 'freeText') {
    title = 'Freitext-Wunsch';
    subtitle = `„${wish.song.description}“`;
  } else {
    title = track?.title;
    subtitle = track ? trackLine(track) : '';
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.line.default,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.votes}>
          <AppText variant="title">{wish.votes}</AppText>
          <AppText variant="caption" tone="muted">
            {wish.votes === 1 ? 'Stimme' : 'Stimmen'}
          </AppText>
        </View>
        <View style={styles.details}>
          <AppText variant="headline">{title}</AppText>
          <AppText tone="secondary">{subtitle}</AppText>
        </View>
      </View>

      {greeting ? <AppText style={{ color: colors.data.text }}>Gruß: „{greeting}“</AppText> : null}

      {quota ? (
        <View style={[styles.divider, { borderTopColor: colors.line.default }]}>
          <AppText tone="secondary">{quotaLine(quota)}</AppText>
        </View>
      ) : null}
    </View>
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
  confirmation: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: spacing.sm,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  votes: {
    alignItems: 'center',
    minWidth: 48,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  divider: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  done: {
    alignSelf: 'stretch',
  },
});
