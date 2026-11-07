# 0005: Stubs instead of a backend

- Status: Accepted
- Date: 2026-11-07

## Context

#30 proposed Supabase for ratings, wishes and realtime, so the studio could see new ratings live on
a second device and listeners could get real accounts. The listener stories already run against
in-memory stubs, and the assignment asks for stubs for every station interface, not for a real
backend. The demo sheet already forces every state the presentation needs.

## Decision

The prototype stays on stubs. "Notify the moderator immediately" is shown on one device: the
`NotificationService` stub pushes each `StudioEvent` to its subscribers, and the role switch
(0002) moves from listener to studio. Several listeners rating the same show are simulated by a
listener switch in the demo sheet instead of accounts.

## Alternatives

| Option                    | Why not                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Supabase as extra adapter | Schema, policies, keys and a second environment for a feature the stub already shows |
| Own realtime server       | Server code and hosting outside the scope of a mobile prototype                      |
| Real accounts             | Out of scope per 0002, the role switch covers both sides                             |

## Consequences

- No network, no secrets, no external service that can fail during the presentation.
- Realtime across two devices is not shown; it is a stated limitation of the prototype.
- A real backend later is one more adapter behind the existing ports (0001), screens stay unchanged.
