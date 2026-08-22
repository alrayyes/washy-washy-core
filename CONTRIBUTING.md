# Contributing

## Setup

```sh
bun install
bun run prepare  # installs the git hooks (lefthook)
```

## Workflow

- The failing test comes first, then the least code that makes it pass, then
  the refactor.
- One logical change per commit. Commits follow
  [Conventional Commits](https://www.conventionalcommits.org/), linted by
  commitlint on every commit and, again, on the pull request title (a squash
  merge makes that title the commit that lands on `main`, and
  [semantic-release](https://semantic-release.gitbook.io/) reads it to decide
  the next version — `feat:` a minor, `fix:` a patch, a `BREAKING CHANGE:`
  footer a major, and a pull request of only `docs:`/`chore:` releases
  nothing).
- `bun run check` before you push — lint, typecheck, test, in that order. The
  pre-push hook runs the same commands, so a red push means something the
  hook itself couldn't catch (usually a merge in between).
- Work lands through a pull request. Nothing is pushed directly to `main`.

## Commands

- `bun run check` — everything CI checks, in one command
- `bun test test/csv.test.ts` — one file, when iterating
- `bun run build` — emit `dist/` via [tsdown](https://tsdown.dev)
- `bun run lint:fix` — Biome, writing its own fixes

## Pull requests

- [ ] `bun run check` passes locally
- [ ] The README is still true
- [ ] Every exported function/type keeps its TSDoc comment
- [ ] The commits (and the pull request title) read as Conventional Commits
