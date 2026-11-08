import { router } from 'expo-router';
import { CircleAlert, Clock } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';

import { AreaScreen } from '@/components/area-screen';
import { HistoryRow, HistoryRowSkeleton } from '@/components/history/history-row';
import { useHistory } from '@/components/history/use-history';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { AppButton, AppText, StatusBanner } from '@/components/ui';
import { clockTime } from '@/components/wish/wish-format';
import { schedule } from '@/seed/schedule';
import { radius, spacing, useTheme } from '@/theme';

const skeletonRows = 8;
const dayStart = schedule.slot('morgen');
const dayStartTime = `${String(Math.floor(dayStart.start / 60)).padStart(2, '0')}:00`;

export default function HistoryScreen() {
  const colors = useTheme();
  const now = useTickingNow();
  const { state, retry } = useHistory();
  const empty = state.status === 'loaded' && state.tracks.length === 0;
  const ratedCount =
    state.status === 'loaded'
      ? state.tracks.filter(({ track }) => state.scores.has(track.id)).length
      : 0;

  return (
    <AreaScreen
      area="listener"
      status={
        <AppText variant="mono" tone="muted">
          {clockTime(now)}
        </AppText>
      }
    >
      <View style={[styles.heading, { borderColor: colors.line.default }]}>
        <AppText variant="title" accessibilityRole="header">
          Wiedergabeverlauf
        </AppText>
        <AppText tone="secondary">
          {empty
            ? 'Noch keine Titel heute'
            : `Tippen zum Bewerten${ratedCount > 0 ? ` · ${ratedCount} bereits bewertet` : ''}`}
        </AppText>
      </View>

      {state.status === 'loading' && (
        <View accessible accessibilityRole="progressbar" accessibilityLabel="Verlauf wird geladen">
          {Array.from({ length: skeletonRows }, (_, i) => (
            <HistoryRowSkeleton key={i} index={i} />
          ))}
        </View>
      )}

      {state.status === 'failed' && (
        <View style={styles.failed}>
          <StatusBanner
            tone="error"
            title="Verlauf gerade nicht verfügbar"
            text="Keine Verbindung zum Sender."
            icon={<CircleAlert size={20} color={colors.critical.text} />}
          />
          <AppButton label="Erneut versuchen" variant="secondary" onPress={retry} />
        </View>
      )}

      {empty && (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { borderColor: colors.line.strong }]}>
            <Clock size={32} color={colors.text.muted} />
          </View>
          <AppText variant="title" style={styles.centered}>
            Noch nichts gelaufen
          </AppText>
          <AppText tone="secondary" style={styles.centered}>
            Der Sendetag beginnt um {dayStartTime} mit „{dayStart.title}“. Ab dann sammelt sich hier
            jeder gespielte Titel.
          </AppText>
          <AppButton
            label="Zu „Jetzt läuft“"
            variant="secondary"
            onPress={() => router.navigate('/')}
          />
        </View>
      )}

      {state.status === 'loaded' && !empty && (
        <FlatList
          data={state.tracks}
          keyExtractor={(played) => played.startedAt.toISOString()}
          renderItem={({ item }) => (
            <HistoryRow
              played={item}
              score={state.scores.get(item.track.id)}
              onPress={() =>
                router.push({
                  pathname: '/rate/track',
                  params: { trackId: item.track.id, startedAt: item.startedAt.getTime() },
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AreaScreen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  list: { gap: spacing.sm },
  failed: { gap: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centered: { textAlign: 'center' },
});
