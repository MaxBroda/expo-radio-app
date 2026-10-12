import { Text, type TextProps } from 'react-native';

import { typography, useTheme, type Colors, type TypographyVariant } from '@/theme';

export type TextTone =
  'default' | 'secondary' | 'muted' | 'disabled' | 'accent' | 'data' | 'critical' | 'onAccent';

function toneColor(colors: Colors, tone: TextTone): string {
  switch (tone) {
    case 'default':
      return colors.text.default;
    case 'secondary':
      return colors.text.secondary;
    case 'muted':
      return colors.text.muted;
    case 'disabled':
      return colors.text.disabled;
    case 'accent':
      return colors.accent.base;
    case 'data':
      return colors.data.base;
    case 'critical':
      return colors.critical.base;
    case 'onAccent':
      return colors.accent.ink;
  }
}

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  const colors = useTheme();
  return (
    <Text style={[typography[variant], { color: toneColor(colors, tone) }, style]} {...props} />
  );
}
