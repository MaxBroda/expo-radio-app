import { StyleSheet, View } from 'react-native';

import { clockTime } from '@/components/wish/wish-format';
import { AppButton, AppText, Card } from '@/components/ui';
import type { Show } from '@/domain/show';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { initials } from './now-playing-format';

type Props = { show: Show; onRate: () => void };

export function ShowCard({ show, onRate }: Props) {
  const colors = useTheme();
  const until = `bis ${clockTime(show.endsAt)}`;

  return (
    <Card style={styles.card}>
      {show.hostName && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.avatar, { backgroundColor: colors.data.surface }]}
        >
          <AppText variant="headline" tone="data">
            {initials(show.hostName)}
          </AppText>
        </View>
      )}
      <View style={styles.details}>
        <AppText variant="headline">{show.title}</AppText>
        <AppText tone="secondary">
          {show.hostName ? `${show.hostName} · ${until}` : `Ohne Moderation · ${until}`}
        </AppText>
      </View>
      {show.hostName && (
        <AppButton
          label="bewerten"
          variant="secondary"
          size="compact"
          onPress={onRate}
          accessibilityLabel={`Moderation von ${show.hostName} bewerten`}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, gap: 2 },
});
