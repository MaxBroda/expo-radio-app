import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type TappableFeedback = 'surface' | 'listRow' | 'accent';

type Props = Omit<PressableProps, 'style' | 'children' | 'android_ripple'> & {
  feedback?: TappableFeedback;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Single source of press feedback. Opacity 0.4 is deliberately strong: subtler values are
 * barely visible on the dark background.
 */
export function Tappable({ feedback = 'surface', style, children, ...props }: Props) {
  const colors = useTheme();
  const ripple = feedback === 'accent' ? colors.ripple.accent : colors.ripple.neutral;

  return (
    <Pressable
      android_ripple={{ color: ripple, foreground: true }}
      style={({ pressed }) => [
        style,
        pressed &&
          (feedback === 'listRow' ? { backgroundColor: colors.pressedOverlay } : { opacity: 0.4 }),
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
