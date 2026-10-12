import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText } from '@/components/ui';
import { screenPadding, spacing, useTheme } from '@/theme';

export default function Home() {
  const colors = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <View style={styles.center}>
        <AppText variant="wordmark">WELLE 7</AppText>
        <AppText variant="label" tone="muted">
          Immer eine Welle voraus.
        </AppText>
      </View>
      <AppButton
        label="Components"
        size="compact"
        variant="secondary"
        onPress={() => router.push('/components')}
        style={styles.link}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: screenPadding.listener },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  link: { alignSelf: 'center' },
});
