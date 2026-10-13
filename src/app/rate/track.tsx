import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { screenPadding } from '@/theme';

export default function RateTrackScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Playlist bewerten" />
      <View style={styles.content}>
        <ScreenPlaceholder title="Playlist bewerten" screenshots="07–10, 13" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: screenPadding.listener },
});
