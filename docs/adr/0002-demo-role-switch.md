# 0002: Demo role switch instead of login

- Status: Accepted
- Date: 2026-10-13

## Context

The app has two audiences: listeners and the studio. Accounts, registration and profiles are
explicitly out of scope, yet the presentation has to show both sides, ideally on one device.

## Decision

The active role lives in `RoleProvider`. The root stack wraps each area in
`Stack.Protected guard={role === ...}`, so routes of the other role do not exist while it is
inactive. The role is switched in the demo sheet, which is always reachable through the DEMO badge
and is labelled as not part of the app. Switching replaces the current route with the home of the
new role, because the guard removes the screens underneath.

## Alternatives

| Option                       | Why not                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Real authentication          | Out of scope, adds accounts nobody needs for the prototype  |
| Two separate apps            | Double setup, the link between both sides is harder to show |
| Studio as a hidden extra tab | The studio would be reachable for every listener            |

## Consequences

- No security: anyone can switch roles. This is a stated assumption, not an oversight.
- Guards still prevent navigating into the other role's routes, which tests cover.
- Real accounts later replace `RoleProvider`; the guards can stay.
