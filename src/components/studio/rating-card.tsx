import { AppText, Card, Pill } from '@/components/ui';
import type { Rating } from '@/domain/rating';
import { useTheme } from '@/theme';
import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export function RatingCard({ rating, isNew }: { rating: Rating; isNew?: boolean }) {
  // TO-DO: color of score pill (4-5 purple, 3 grey, 1-2 orange)

  const colors = useTheme();
  const kind = rating.subject.kind === 'track' ? 'Titel' : 'Moderation';
  const time = rating.createdAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <View style={styles.header}>
        <Pill
          label={`${rating.score}/5`}
          icon={<Star size={12} color={colors.text.muted} fill={colors.text.muted} />}
        />

        <Pill label={kind} />

        {isNew && <Pill label="neu" active />}

        <AppText variant="mono" tone="muted" style={styles.time}>
          {time}
        </AppText>
      </View>

      {rating.comment && <AppText variant="bodyStrong">„{rating.comment}“</AppText>}

      {/* !!! Get Song & Artist from Datamodel */}
      <AppText variant="caption" tone="muted">
        Song - Künstler
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { marginLeft: 'auto' },
});
