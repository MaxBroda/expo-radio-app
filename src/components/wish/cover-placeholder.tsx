import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type Colors } from '@/theme';

const defaultCoverSize = 48;

function paletteFrom(colors: Colors) {
  return [colors.accent.base, colors.data.base, colors.critical.base];
}

function seedValue(seed: string): number {
  let result = 0;

  for (const character of seed) {
    result = (result * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(result);
}

export function CoverPlaceholder({
  seed,
  size = defaultCoverSize,
}: {
  seed: string;
  size?: number;
}) {
  const colors = useTheme();
  const palette = paletteFrom(colors);
  const background = palette[seedValue(seed) % palette.length];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size > 96 ? radius.lg : radius.thumb,
          backgroundColor: colors.surface.raised,
        },
      ]}
    >
      <View
        style={[
          styles.decoration,
          {
            width: size * 0.7,
            height: size * 0.55,
            borderTopLeftRadius: size * 0.55,
            borderTopRightRadius: size * 0.55,
            backgroundColor: background,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  decoration: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
});
