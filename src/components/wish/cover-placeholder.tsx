import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type Colors } from '@/theme';

const size = 48;

const tints = (colors: Colors) => [colors.accent.base, colors.data.base, colors.critical.base];

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(value);
}

/** Generated stand-in, original artwork is protected (ADR 0003). The seed picks the tint. */
export function CoverPlaceholder({ seed }: { seed: string }) {
  const colors = useTheme();
  const palette = tints(colors);
  const tint = palette[hash(seed) % palette.length];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.cover, { backgroundColor: colors.surface.raised }]}
    >
      <View style={[styles.shape, { backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: size, height: size, borderRadius: radius.thumb, overflow: 'hidden' },
  shape: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: size * 0.7,
    height: size * 0.55,
    borderTopLeftRadius: size * 0.55,
    borderTopRightRadius: size * 0.55,
  },
});
