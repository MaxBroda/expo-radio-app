# 0003: Real track metadata from MusicBrainz

- Status: Accepted
- Date: 2026-10-13

## Context

The demo needs a music catalog of 100 to 300 tracks for now playing, history, ratings and song
search. Invented tracks match the mock-ups but feel artificial. Real tracks raise the question of
which data may be shown.

## Decision

The catalog uses 149 real tracks. Title, artist, album, year and duration come from MusicBrainz,
whose core data is CC0. A one-time import resolved a hand-picked list; only the result is committed
as `src/seed/catalog.json`, the app never calls MusicBrainz. Covers stay generated placeholders,
because original artwork is protected. The show profile of each track is our own assignment, not
MusicBrainz tags, which carry a non-commercial licence.

## Alternatives

| Option                 | Why not                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| Invented tracks        | Less authentic, although they match the mock-ups one to one       |
| Spotify or Apple APIs  | Terms of use restrict storing and displaying the data             |
| MusicBrainz at runtime | Rate limit of one request per second, network needed for the demo |

## Consequences

- Screens differ from the mock-ups in track names.
- Fake listener comments sit next to real artists. Critical comments therefore target the moment
  ("too much bass for this time of day"), never the music.
- Changing the catalog means editing the JSON by hand or running an import again.
