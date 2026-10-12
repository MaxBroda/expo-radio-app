import { View, type DimensionValue } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  width: DimensionValue;
  height: number;
  radius?: number;
};

export function Skeleton({ width, height, radius = 6 }: Props) {
  const colors = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius, backgroundColor: colors.surface.disabled }}
    />
  );
}
