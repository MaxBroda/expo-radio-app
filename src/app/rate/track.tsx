import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { RatingStars } from '@/components/rating-stars';
import { AppText, TextField } from '@/components/ui';
import type { Score } from '@/domain/rating';
import { screenPadding, spacing } from '@/theme';

export default function RateTrackScreen() {
  const [score, setScore] = useState<Score>();
  const [comment, setComment] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Playlist bewerten" />
      <View style={styles.content}>
        <AppText variant="headline">Wie findest du den Titel?</AppText>
        <RatingStars value={score} onChange={setScore} />
        <TextField
          label="Kommentar"
          optional
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder="Was war gut, was nicht?"
          maxLength={240}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: screenPadding.listener, gap: spacing.md },
});
