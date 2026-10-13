# 0004: Demo clock and generated seed

- Status: Accepted
- Date: 2026-10-13

## Context

What plays, which show is on air and whether a rating window is open depend on the time of day.
The demo has to look the same whenever it is presented, every show has to be reachable without
waiting, and the dashboard numbers (average, trend, counts) must match the ratings shown.

## Decision

`DemoClock` starts on a fixed Thursday at 18:42 and runs in real time from there; the demo sheet
can jump to any show. History, ratings and requests are generated from the clock with a seeded
random generator: the same time always yields the same data. Tracks play back to back according
to each slot's profile, and ratings only refer to what was playing or on air at their timestamp.
Derived values are never stored but calculated from the ratings.

## Alternatives

| Option                            | Why not                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| Real device time                  | The demo would depend on when it is presented                |
| Frozen clock                      | No progress bar, no track changes, no live feel              |
| Static JSON with fixed timestamps | Stale after a minute, and stored averages drift from ratings |

## Consequences

- Tests check invariants of the seed (references, window size, average) instead of fixed values.
- A jump rebuilds the demo data; ratings and requests entered before are lost.
- Real systems later provide the time themselves; adapters must not rely on the demo clock beyond
  the stubs.
