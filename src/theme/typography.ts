import type { TextStyle } from 'react-native';

import { fonts } from './fonts';

type Level = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'
>;

function level(
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacingEm = 0,
): Level {
  return {
    fontFamily,
    fontSize,
    lineHeight: Math.round(fontSize * lineHeight),
    letterSpacing: fontSize * letterSpacingEm,
  };
}

export const typography = {
  display: level(fonts.bold, 26, 1.12, -0.01),
  title: level(fonts.bold, 22, 1.2, -0.01),
  headline: level(fonts.semibold, 17, 1.3),
  body: level(fonts.regular, 15, 1.45),
  bodyStrong: level(fonts.semibold, 15, 1.2),
  label: level(fonts.medium, 13, 1.35),
  caption: level(fonts.regular, 12, 1.5),
  overline: { ...level(fonts.semibold, 12, 1.3, 0.08), textTransform: 'uppercase' },
  mono: level(fonts.monoMedium, 12, 1.3, 0.02),
  wordmark: level(fonts.bold, 15, 1, 0.16),
} satisfies Record<string, Level>;

export type TypographyVariant = keyof typeof typography;
