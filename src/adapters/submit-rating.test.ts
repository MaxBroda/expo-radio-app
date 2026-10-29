import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Rating, RatingInput } from '@/domain/rating';
import type { TrackId } from '@/domain/track';
import type { FeedbackHub } from '@/ports/feedback-hub';

import { hasRatedOnDevice } from './rating-history';
import { submitRatingAndRemember } from './submit-rating';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const input: RatingInput = { score: 4, subject: { kind: 'track', trackId: 'track-1' as TrackId } };
const rating: Rating = {
  ...input,
  id: 'rating-1' as Rating['id'],
  createdAt: new Date(2026, 9, 29),
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('remembers the subject after the hub accepts the rating', async () => {
  const feedbackHub: FeedbackHub = {
    submitRating: jest.fn().mockResolvedValue(rating),
    list: jest.fn(),
  };
  expect(await submitRatingAndRemember(feedbackHub, input)).toEqual({ rating, remembered: true });
  expect(feedbackHub.submitRating).toHaveBeenCalledWith(input);
  expect(await hasRatedOnDevice(rating.subject)).toBe(true);
});

test('does not remember the subject if the hub rejects the rating', async () => {
  const feedbackHub: FeedbackHub = {
    submitRating: jest.fn().mockRejectedValue(new Error('offline')),
    list: jest.fn(),
  };
  await expect(submitRatingAndRemember(feedbackHub, input)).rejects.toThrow('offline');
  expect(await hasRatedOnDevice(input.subject)).toBe(false);
});

test('keeps the accepted rating when local storage fails', async () => {
  const feedbackHub: FeedbackHub = {
    submitRating: jest.fn().mockResolvedValue(rating),
    list: jest.fn(),
  };
  const write = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage'));
  try {
    expect(await submitRatingAndRemember(feedbackHub, input)).toEqual({
      rating,
      remembered: false,
    });
    expect(feedbackHub.submitRating).toHaveBeenCalledTimes(1);
  } finally {
    write.mockRestore();
  }
});
