# Contributing

## Workflow

1. Pick a ticket on the project board and move it to **In Progress**.
2. Create a branch from `main`, ideally from the ticket ("Create a branch" in the sidebar, or
   `gh issue develop <nr> --name feature/<nr>-<slug> --base main --checkout`).
3. Open a pull request against `main`. CI must pass before merging.
4. After the merge, move the ticket to **Done** and delete the branch.

One ticket per branch and pull request.

## Branches

```
feature/<ticket>-<short-slug>    feature/14-song-request-screen
fix/<ticket>-<short-slug>        fix/21-rating-window-timezone
```

Lowercase, words separated by hyphens.

## Commits

- One subject line, no body.
- English, lowercase, imperative: `add rating form`, `fix empty history state`.
- One logical change per commit. Tests may go into the same commit or a separate one.

## Pull requests

- Title in German, describing the result: `Screen Songwunsch`.
- `Closes #<ticket>` in the description, so the ticket closes on merge.
- Description in German with these sections, short bullet points:

  ```markdown
  Closes #14

  ## Was kommt mit

  ## Bewusst nicht dabei

  ## Hinweis
  ```

  "Hinweis" is optional. No test plan section: testing is discussed in the review.

- Merge with **Rebase and merge**, so `main` keeps the individual commits.

## Language

| Where                                 | Language |
| ------------------------------------- | -------- |
| Code, comments, README, ADRs, commits | English  |
| UI texts, tickets, pull requests      | German   |

UI texts use the plain form without gender markers: "Hörer", not "Hörer:in".

## Code

- Screens get station systems from `useStations()`, never from an adapter directly.
- Colors, spacing and type only from `@/theme`, no literal values in screens.
- Text through `AppText`, buttons through `AppButton` and the other components in
  `@/components/ui`.
- Comments only where the code cannot say why.
- Architecture decisions that are hard to undo get an ADR in `docs/adr/`.
