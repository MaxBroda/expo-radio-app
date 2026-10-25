import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { spacing, touchTarget, useTheme } from '@/theme';

import { AppText, Tappable } from './ui';

export function ModalHeader({ title }: { title: string }) {
  const colors = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: colors.line.default }]}>
      <Tappable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Zurück"
        style={styles.back}
      >
        <ChevronLeft size={24} color={colors.text.default} />
      </Tappable>
      <AppText variant="headline" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget / 2,
  },
});
