import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

import { clockTime } from '@/components/wish/wish-format';

type Props = { status: 'connecting' | 'live' | 'offline'; now: Date };

export function ConnectionPill({ status, now }: Props) {
  const colors = useTheme();
  const label =
    status === 'live' ? `LIVE ${clockTime(now)}` : status === 'offline' ? 'OFFLINE' : 'verbindet';
  const dot =
    status === 'live'
      ? { backgroundColor: colors.accent.base }
      : status === 'offline'
        ? { borderWidth: 1.5, borderColor: colors.text.secondary }
        : { backgroundColor: colors.line.strong };

  return (
    <View
      accessible
      accessibilityLabel={
        status === 'live' ? `Live, ${clockTime(now)} Uhr` : status === 'offline' ? 'Offline' : label
      }
      style={[styles.pill, { borderColor: colors.line.default }]}
    >
      <View style={[styles.dot, dot]} />
      <AppText variant="mono" tone={status === 'connecting' ? 'muted' : 'default'}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 32,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
});
