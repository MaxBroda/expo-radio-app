import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type Colors } from '@/theme';

const tints = (colors: Colors) => [colors.accent.base, colors.data.base, colors.critical.base];

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(value);
}

/** Generated stand-in, original artwork is protected (ADR 0003). The seed picks the tint. */
export function CoverPlaceholder({ seed, size = 48 }: { seed: string; size?: number }) {
  const colors = useTheme();
  const palette = tints(colors);
  const tint = palette[hash(seed) % palette.length];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.cover,
        { width: size, height: size, borderRadius: size > 96 ? radius.lg : radius.thumb },
        { backgroundColor: colors.surface.raised },
      ]}
    >
      <View
        style={[
          styles.shape,
          {
            width: size * 0.7,
            height: size * 0.55,
            borderTopLeftRadius: size * 0.55,
            borderTopRightRadius: size * 0.55,
            backgroundColor: tint,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { overflow: 'hidden' },
  shape: { position: 'absolute', left: 0, bottom: 0 },
});
