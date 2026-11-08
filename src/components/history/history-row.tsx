import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Skeleton, Tappable } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { clockTime } from '@/components/wish/wish-format';
import type { Score } from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import { radius, spacing, useTheme } from '@/theme';

const coverSize = 48;

type Props = { played: PlayedTrack; score?: Score; onPress: () => void };

export function HistoryRow({ played: { track, startedAt }, score, onPress }: Props) {
  const rated = score ? `, bewertet mit ${score} von 5` : '';
  return (
    <Tappable
      feedback="listRow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} von ${track.artist}, ${clockTime(startedAt)} Uhr${rated}`}
      accessibilityHint="Öffnet die Bewertung für diesen Titel"
      style={styles.row}
    >
      <CoverPlaceholder seed={track.id} size={coverSize} />
      <View style={styles.titles}>
        <AppText variant="headline" numberOfLines={1}>
          {track.title}
        </AppText>
        <AppText tone="secondary" numberOfLines={1}>
          {track.artist}
        </AppText>
      </View>
      {score && <ScoreBadge score={score} />}
      <AppText variant="mono" tone="muted">
        {clockTime(startedAt)}
      </AppText>
    </Tappable>
  );
}

function ScoreBadge({ score }: { score: Score }) {
  const colors = useTheme();
  const tone = score <= 2 ? 'critical' : 'data';
  const { surface, border, base } = colors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: surface, borderColor: border }]}>
      <Star size={12} color={base} fill={base} />
      <AppText variant="mono" tone={tone}>
        {score}/5
      </AppText>
    </View>
  );
}

const lineWidths = [['62%', '38%'] as const, ['48%', '30%'] as const, ['70%', '42%'] as const];

export function HistoryRowSkeleton({ index }: { index: number }) {
  const [title, artist] = lineWidths[index % lineWidths.length];
  return (
    <View style={styles.row}>
      <Skeleton width={coverSize} height={coverSize} radius={radius.thumb} />
      <View style={styles.titles}>
        <Skeleton width={title} height={14} />
        <Skeleton width={artist} height={11} />
      </View>
      <Skeleton width={32} height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  titles: { flex: 1, gap: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 26,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
});
