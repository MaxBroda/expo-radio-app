import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { StrictMode, type PropsWithChildren } from 'react';

import { DemoClock } from '@/demo/demo-clock';
import type { Rating, RatingInput } from '@/domain/rating';
import type { TrackId } from '@/domain/track';
import type { FeedbackHub } from '@/ports/feedback-hub';

import { RatingProvider, useRatingSubmission } from './rating-provider';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

test('shares one rating flow when a screen renders again', async () => {
  await AsyncStorage.clear();
  const now = new Date(2026, 9, 15, 18, 42);
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput): Promise<Rating> => ({
    ...input,
    id: 'rating-1' as Rating['id'],
    createdAt: now,
  }));
  const hub: FeedbackHub = { submitRating: send, list: jest.fn() };
  const wrapper = ({ children }: PropsWithChildren) => (
    <RatingProvider clock={clock} feedbackHub={hub}>
      {children}
    </RatingProvider>
  );
  const { result, rerender } = await renderHook(() => useRatingSubmission(), { wrapper });
  const original = result.current;
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;

  expect(await original.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  await rerender({});
  expect(result.current).toBe(original);
  expect(await result.current.submit(track, 4)).toEqual({ status: 'alreadyRated' });
  expect(send).toHaveBeenCalledTimes(1);
});

test('reacts to clock jumps after strict mode effect cleanup', async () => {
  await AsyncStorage.clear();
  const now = new Date(2026, 9, 15, 18, 42);
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput): Promise<Rating> => ({
    ...input,
    id: 'rating-1' as Rating['id'],
    createdAt: now,
  }));
  const hub: FeedbackHub = { submitRating: send, list: jest.fn() };
  const wrapper = ({ children }: PropsWithChildren) => (
    <StrictMode>
      <RatingProvider clock={clock} feedbackHub={hub}>
        {children}
      </RatingProvider>
    </StrictMode>
  );
  const { result } = await renderHook(() => useRatingSubmission(), { wrapper });
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;

  expect(await result.current.submit(track, 4)).toMatchObject({ status: 'sent' });
  await act(() => {
    clock.jumpTo(now);
  });
  expect(await result.current.submit(track, 4)).toMatchObject({ status: 'sent' });
  expect(send).toHaveBeenCalledTimes(2);
});
