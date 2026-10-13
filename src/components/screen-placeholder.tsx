import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './ui';

type Props = PropsWithChildren<{ title: string; screenshots: string }>;

export function ScreenPlaceholder({ title, screenshots, children }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="mono" tone="muted">
        Platzhalter · {screenshots}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.md },
});
