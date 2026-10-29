import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RatingSubject } from '@/domain/rating';

function keyFor(subject: RatingSubject): string {
  const id = subject.kind === 'track' ? subject.trackId : subject.showId;
  return `rating:${subject.kind}:${id}`;
}

export async function hasRatedOnDevice(subject: RatingSubject): Promise<boolean> {
  return (await AsyncStorage.getItem(keyFor(subject))) === '1';
}

export async function rememberRatingOnDevice(subject: RatingSubject): Promise<void> {
  await AsyncStorage.setItem(keyFor(subject), '1');
}
