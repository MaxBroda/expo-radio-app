# WELLE 7

Companion app for the fictional radio station WELLE 7. Listeners see what is playing, rate the
playlist and the host, and request songs. The studio sees ratings and requests as they arrive.

Built with Expo and React Native as a group project at IU.

## Setup

Requirements: Node 24 (see `.nvmrc`) and the Expo Go app on a phone, or an iOS simulator /
Android emulator.

```bash
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the camera app (iOS). Phone and computer need to be in
the same network.

`npm start` also regenerates the typed routes in `.expo/types`. After adding or renaming a screen,
restart it once, otherwise `tsc` reports unknown routes.

| Command             | Purpose                  |
| ------------------- | ------------------------ |
| `npm start`         | Dev server               |
| `npm test`          | Jest tests               |
| `npm run lint`      | ESLint                   |
| `npm run typecheck` | TypeScript               |
| `npm run format`    | Prettier, writes changes |

The same checks run in git hooks (pre-commit: lint-staged and typecheck, pre-push: tests) and in
CI on every pull request.

## Demo

There is no login. The **DEMO** badge in the header opens the demo sheet:

- **Role:** switches between listener and studio.
- **Show:** jumps to any show of the schedule. The demo clock starts on a Thursday at 18:42
  (Feierabendwelle) and runs in real time from there.
- **States:** forces loading, offline, empty history, failed sending, closed rating window,
  exhausted wish quota and a rating rush.
- **Components:** preview of the UI components and the theme switch.

## Architecture

```
src/
  app/          routes (Expo Router), one file per screen
  domain/       domain types: Track, Show, Rating, Wish, StudioEvent
  ports/        interfaces of the station systems
  adapters/     implementations of the ports, currently stubs
  stations/     wires adapters together and provides them to the screens
  seed/         schedule, music catalog and generated demo data
  demo/         demo clock and demo states
  role/         listener / studio role
  navigation/   tab bar
  components/   shared components, ui/ holds the design system primitives
  theme/        design tokens: colors, typography, spacing
```

Screens never talk to a station system directly. They get the systems from `useStations()` and only
know the interfaces in `ports/`. Replacing a stub with a real system means writing another adapter;
screens stay unchanged. Decisions like this one are recorded in [`docs/adr/`](docs/adr/).

The screen designs are in [`docs/design/screens/`](docs/design/screens/).

## Assumed station systems

The app integrates into station systems that do not exist. Names and operations are assumptions:

| System                         | Purpose                                       | Port                  |
| ------------------------------ | --------------------------------------------- | --------------------- |
| Playout (broadcast automation) | What is playing and what played before        | `Playout`             |
| Music database                 | Track metadata and search                     | `MusicDatabase`       |
| Feedback hub                   | Receives ratings                              | `FeedbackHub`         |
| Request system                 | Receives song requests, the studio decides    | `WishSystem`          |
| Notification service           | Pushes new ratings and requests to the studio | `NotificationService` |

## Demo data

- **Schedule:** six slots from Welle am Morgen to the unmoderated Nachtschiene.
- **Music catalog:** 149 real tracks. Title, artist, album, year and duration come from
  [MusicBrainz](https://musicbrainz.org), whose core data is CC0. Covers are generated placeholders.
- **Ratings, requests, history:** generated from the demo clock, so the same time always shows the
  same data. Averages and trends are calculated from the ratings, never stored.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
