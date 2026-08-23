# Contributing

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the file layout, how a
chart and machine flow through the modules, and the naming conventions.

## Setup

```sh
bun install
bun run prepare      # installs the git hooks (lefthook)
bun run prose:sync   # fetches Vale's style packages; needed once before `check` works
```

## Workflow

- The failing test comes first, then the least code that makes it pass, then
  the refactor.
- **Unit tests only, deliberately.** Every exported function is pure —
  strings and parsed values in, values or a thrown error out, no file I/O,
  no network, no other layer that could fail independently. There's nothing
  here an integration or end-to-end test would catch that a unit test
  doesn't already, so `test/*.test.ts` is the whole suite.
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
- `bun run docs` — build the [TypeDoc](https://typedoc.org) site into
  `docs-site/` (gitignored; deployed by `.github/workflows/docs.yml` on push
  to `main`, not part of `bun run check`)
- `bun run schema` — regenerate `schema/config.schema.json` from the
  `Config` type; `lint:schema` (part of `check`) fails if this would produce
  a diff, so run it after touching `Config`'s shape and commit the result
- `bun run lint:fix` — Biome, writing its own fixes
- `bun run lint:prose:advice` — the full Vale read, including style advice
  the error-level `lint:prose` doesn't fail on
- Grammar/spelling (LTeX) only runs in CI and over LSP in the editor — see
  `rules/markdown.md` in `dotfiles` for why it's not in a hook here

## Pull requests

- [ ] `bun run check` passes locally
- [ ] The README is still true
- [ ] Every exported function/type keeps its TSDoc comment
- [ ] The commits (and the pull request title) read as Conventional Commits
