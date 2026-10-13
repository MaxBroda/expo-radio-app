import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { screenPadding, spacing } from '@/theme';

import { AppHeader } from './app-header';

type Props = PropsWithChildren<{ area: 'listener' | 'studio' }>;

export function AreaScreen({ area, children }: Props) {
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { padding: screenPadding[area] }]}>
      <AppHeader area={area} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: spacing.lg },
});
