import { demoDay } from '@/demo/demo-clock';

import { catalog } from './catalog';
import { ownDemoRatings } from './own-ratings';
import { Rotation } from './rotation';
import { schedule } from './schedule';

const rotation = new Rotation(catalog, schedule, demoDay);
const now = new Date(2026, 9, 15, 18, 42);

test('rates the last played track high and an earlier one low', () => {
  const history = rotation.history(now, 5);

  expect(ownDemoRatings(rotation, now)).toEqual([
    { subject: { kind: 'track', trackId: history[0].track.id }, score: 4 },
    { subject: { kind: 'track', trackId: history[4].track.id }, score: 2 },
  ]);
});

test('never rates the track on air, so it stays open for the demo', () => {
  const onAir = rotation.at(now).track.id;

  expect(ownDemoRatings(rotation, now).map(({ subject }) => subject)).not.toContainEqual({
    kind: 'track',
    trackId: onAir,
  });
});
