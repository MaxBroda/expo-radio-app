import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RatingSubject, Score } from '@/domain/rating';
import type { TrackId } from '@/domain/track';

export type HistoryScope = 'device' | 'demo';

function prefixFor(scope: HistoryScope): string {
  return scope === 'demo' ? 'rating:demo:' : 'rating:';
}

function keyFor(subject: RatingSubject, scope: HistoryScope): string {
  const id = subject.kind === 'track' ? subject.trackId : subject.showId;
  return `${prefixFor(scope)}${subject.kind}:${id}`;
}

function toScore(value: string | null): Score | undefined {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? (score as Score) : undefined;
}

export async function hasRatedOnDevice(
  subject: RatingSubject,
  scope: HistoryScope = 'device',
): Promise<boolean> {
  return (await AsyncStorage.getItem(keyFor(subject, scope))) !== null;
}

export async function ratedScoreOnDevice(
  subject: RatingSubject,
  scope: HistoryScope = 'device',
): Promise<Score | undefined> {
  return toScore(await AsyncStorage.getItem(keyFor(subject, scope)));
}

export async function trackScoresOnDevice(
  scope: HistoryScope = 'device',
): Promise<Map<TrackId, Score>> {
  const prefix = `${prefixFor(scope)}track:`;
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
  const scores = new Map<TrackId, Score>();
  for (const [key, value] of await AsyncStorage.multiGet(keys)) {
    const score = toScore(value);
    if (score) scores.set(key.slice(prefix.length) as TrackId, score);
  }
  return scores;
}

export async function rememberRatingOnDevice(
  subject: RatingSubject,
  score: Score,
  scope: HistoryScope = 'device',
): Promise<void> {
  await AsyncStorage.setItem(keyFor(subject, scope), String(score));
}

export async function clearDemoRatingHistory(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith('rating:demo:')));
}
