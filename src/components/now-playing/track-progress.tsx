import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

import { duration } from './now-playing-format';

type Props = { startedAt: Date; durationSec: number; now: Date };

export function TrackProgress({ startedAt, durationSec, now }: Props) {
  const colors = useTheme();
  const elapsed = Math.min(durationSec, Math.max(0, (now.getTime() - startedAt.getTime()) / 1000));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${duration(elapsed)} von ${duration(durationSec)}`}
      accessibilityValue={{ min: 0, max: Math.round(durationSec), now: Math.round(elapsed) }}
      style={styles.container}
    >
      <View style={[styles.track, { backgroundColor: colors.surface.raised }]}>
        <View
          style={[
            styles.fill,
            { width: `${(elapsed / durationSec) * 100}%`, backgroundColor: colors.accent.base },
          ]}
        />
      </View>
      <View style={styles.times}>
        <AppText variant="mono" tone="muted">
          {duration(elapsed)}
        </AppText>
        <AppText variant="mono" tone="muted">
          {duration(durationSec)}
        </AppText>
      </View>
    </View>
  );
}

export function EmptyProgress() {
  const colors = useTheme();
  return <View style={[styles.track, { backgroundColor: colors.surface.raised }]} />;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%' },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
});
