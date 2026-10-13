import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { DemoBadge } from './demo-badge';
import { AppText } from './ui';

export function AppHeader({ area }: { area: 'listener' | 'studio' }) {
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
      {area === 'studio' && <DemoBadge />}
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
