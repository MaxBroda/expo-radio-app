import { router } from 'expo-router';
import { ArrowRightLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText, Tappable } from './ui';

const height = 32;

export function DemoBadge({ static: isStatic = false }: { static?: boolean }) {
  const colors = useTheme();
  const surface = { borderColor: colors.data.border, backgroundColor: colors.data.surface };
  const label = (
    <AppText variant="mono" tone="data" style={styles.label}>
      DEMO
    </AppText>
  );

  if (isStatic) {
    return <View style={[styles.badge, styles.compact, surface]}>{label}</View>;
  }

  return (
    <Tappable
      onPress={() => router.push('/demo')}
      hitSlop={(touchTarget - height) / 2}
      accessibilityRole="button"
      accessibilityLabel="Demo-Steuerung öffnen"
      style={[styles.badge, surface]}
    >
      <ArrowRightLeft size={14} color={colors.data.text} />
      {label}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  compact: { height: 26, paddingHorizontal: 10, backgroundColor: 'transparent' },
  label: { letterSpacing: 1.5 },
});
