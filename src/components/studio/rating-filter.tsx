import { Pill } from '@/components/ui';
import { StyleSheet, View } from 'react-native';

export function RatingFilter() {
  // !!! Add onClick functions
  // TO-DO implement review counter per type
  return (
    <View style={styles.pills}>
      <Pill label="Alle 2" size="large" />
      <Pill label="Titel 1" size="large" />
      <Pill label="Moderation 1" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
