import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type Colors } from '@/theme';

import { AppText } from './app-text';

type Tone = 'error' | 'info' | 'success';

type Props = {
  tone: Tone;
  title: string;
  text?: string;
  icon?: ReactNode;
};

function palette(colors: Colors, tone: Tone) {
  switch (tone) {
    case 'error':
      return {
        backgroundColor: colors.critical.surface,
        borderColor: colors.critical.border,
        title: colors.critical.text,
      };
    case 'info':
      return {
        backgroundColor: colors.surface.default,
        borderColor: colors.line.strong,
        title: colors.text.default,
      };
    case 'success':
      return {
        backgroundColor: colors.data.surface,
        borderColor: colors.data.border,
        title: colors.data.text,
      };
  }
}

export function StatusBanner({ tone, title, text, icon }: Props) {
  const colors = useTheme();
  const { title: titleColor, ...surface } = palette(colors, tone);
  const isError = tone === 'error';

  return (
    <View
      accessible
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
      style={[styles.banner, surface]}
    >
      {icon}
      <View style={styles.content}>
        <AppText variant="bodyStrong" style={[styles.title, { color: titleColor }]}>
          {title}
        </AppText>
        {text && (
          <AppText variant="body" tone="secondary" style={styles.text}>
            {text}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14 },
  text: { fontSize: 13, lineHeight: 20 },
});
