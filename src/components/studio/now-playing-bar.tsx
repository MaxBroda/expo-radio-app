import { AppText, Card } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { StyleSheet, View } from 'react-native';

export function NowPlayingBar() {
  return (
    <Card style={styles.row}>
      {/* !!! get actual track id for the cover */}
      <CoverPlaceholder seed="placeholder" size={36} />

      <View style={styles.info}>
        {/* !!! get actual track title and artist */}
        <AppText variant="bodyStrong" numberOfLines={1}>
          Songtitel — Künstler
        </AppText>

        {/* !!! get actual show title and remaining show time */}
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          Sendung - Rest 1:18 Std
        </AppText>
      </View>

      <View style={styles.remaining}>
        {/* !!! get actual remaining track time */}
        <AppText variant="mono">1:41</AppText>
        <AppText variant="caption" tone="muted">
          Rest Titel
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  remaining: { alignItems: 'flex-end' },
});
