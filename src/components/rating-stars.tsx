import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Score } from '@/domain/rating';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText, Tappable } from './ui';

const scores: Score[] = [1, 2, 3, 4, 5];
const labels: Record<Score, string> = {
  1: 'gar nicht',
  2: 'naja',
  3: 'geht so',
  4: 'gut',
  5: 'top',
};

type Props = { value?: Score; onChange: (score: Score) => void };

export function RatingStars({ value, onChange }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.group}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Sternebewertung">
        {scores.map((score) => {
          const filled = value !== undefined && score <= value;
          return (
            <Tappable
              key={score}
              onPress={() => onChange(score)}
              accessibilityRole="radio"
              accessibilityLabel={`${score} von 5 Sternen: ${labels[score]}`}
              accessibilityState={{ checked: value === score }}
              style={[
                styles.star,
                {
                  backgroundColor: filled ? colors.accent.surface : colors.surface.default,
                  borderColor: filled ? colors.accent.border : colors.line.default,
                },
              ]}
            >
              <Star
                size={spacing.xxl}
                color={filled ? colors.accent.base : colors.text.disabled}
                fill={filled ? colors.accent.base : 'none'}
              />
            </Tappable>
          );
        })}
      </View>
      <AppText tone={value === undefined ? 'muted' : 'accent'} accessibilityLiveRegion="polite">
        {value === undefined ? 'Noch nicht bewertet' : `${value} von 5 · ${labels[value]}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  star: {
    minWidth: touchTarget + spacing.md,
    minHeight: touchTarget + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
