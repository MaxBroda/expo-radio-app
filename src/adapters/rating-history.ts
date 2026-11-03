import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RatingSubject } from '@/domain/rating';

export type HistoryScope = 'device' | 'demo';

function keyFor(subject: RatingSubject, scope: HistoryScope): string {
  const id = subject.kind === 'track' ? subject.trackId : subject.showId;
  const prefix = scope === 'demo' ? 'rating:demo:' : 'rating:';
  return `${prefix}${subject.kind}:${id}`;
}

export async function hasRatedOnDevice(
  subject: RatingSubject,
  scope: HistoryScope = 'device',
): Promise<boolean> {
  return (await AsyncStorage.getItem(keyFor(subject, scope))) === '1';
}

export async function rememberRatingOnDevice(
  subject: RatingSubject,
  scope: HistoryScope = 'device',
): Promise<void> {
  await AsyncStorage.setItem(keyFor(subject, scope), '1');
}

export async function clearDemoRatingHistory(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith('rating:demo:')));
}
