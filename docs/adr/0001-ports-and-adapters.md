# 0001: Station systems behind ports, stubs first

- Status: Accepted
- Date: 2026-10-13

## Context

The app is meant to integrate into existing station systems: playout, music database, feedback
hub, request system and notification service. None of them exist. The assignment requires stubs
for every system interface, and their names and operations may be assumed.

## Decision

Each station system is an interface in `src/ports/`, typed against the domain types in
`src/domain/`. Implementations live in `src/adapters/`, currently only stubs. `createStubStations()`
bundles one instance of each, `StationsProvider` hands them to the screens, and screens use
`useStations()`. No screen imports an adapter.

## Alternatives

| Option                            | Why not                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| Mock data directly in the screens | Every screen would need rework once a real system arrives    |
| Mocked HTTP API (e.g. MSW)        | Invents a wire protocol we do not need for the prototype     |
| Own backend from the start        | Server work before a single screen exists; see #30 for later |

## Consequences

- A real system or Supabase (#30) is one more adapter; screens stay unchanged.
- Tests create fresh station instances and need no network.
- Stubs must behave realistically (delays, errors, states), otherwise screens are only tested
  against the happy path.
