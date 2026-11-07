import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { DemoBadge } from './demo-badge';
import { AppText } from './ui';

export function AppHeader({ area, status }: { area: 'listener' | 'studio'; status?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <AppText variant="wordmark" accessibilityRole="header">
          WELLE 7
        </AppText>
        {area === 'studio' && (
          <AppText variant="headline" tone="data">
            Studio
          </AppText>
        )}
        {area === 'listener' && <DemoBadge />}
      </View>
      {area === 'studio' ? <DemoBadge /> : status}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
