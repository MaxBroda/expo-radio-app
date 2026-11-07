import { StyleSheet, View } from 'react-native';

import { AppText, Skeleton } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { clockTime } from '@/components/wish/wish-format';
import type { PlayedTrack } from '@/domain/track';
import { radius, spacing } from '@/theme';

const coverSize = 48;

export function HistoryRow({ played: { track, startedAt } }: { played: PlayedTrack }) {
  return (
    <View
      accessible
      accessibilityLabel={`${track.title} von ${track.artist}, ${clockTime(startedAt)} Uhr`}
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
      <AppText variant="mono" tone="muted">
        {clockTime(startedAt)}
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
});
