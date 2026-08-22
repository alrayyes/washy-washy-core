<!--
Maintainer note (stripped before this file enters context).
Keep this short and only about what the code cannot say for itself.
-->

# @washy-washy/core

Chart parsing, machine validation and mixing rules — extracted from
`alrayyes/washy-washy-cli`'s `packages/core`. No file I/O, no Bun/Node-only
APIs in the public surface except `csv.ts` (see below).

## Gotchas

- **`csv.ts` is the only file that isn't safe for a browser bundle.**
  `csv-parse` reaches for Node's `Buffer` at import time even when nothing
  calls it, so anything that imports `./index` (which re-exports `csv.ts`)
  into a bundled client dies on `Buffer is not defined`. `./browser` exists
  specifically to exclude it — never add a new export to `browser.ts` that
  transitively imports `csv.ts`.
- **This package has no file I/O.** Reading a machine or chart file from
  disk is a consumer's job (see `washy-washy-cli`'s `src/machine.ts` for the
  Bun-only adapter that wraps `parseMachine`). Adding `fs`/`Bun.file` calls
  here would break the browser entry point and the whole point of splitting
  this out.
- **The published tarball ships only `dist/`, `README.md`, `LICENSE`** — see
  `files` in `package.json`. `npm pack --dry-run` before a release if you've
  touched that field or `tsdown.config.ts`.
- **Two build targets, two entry points, on purpose.** `tsdown.config.ts`
  builds `index.ts` and `browser.ts` as separate outputs rather than one
  bundle with two `exports` pointing into it — that separation is what keeps
  `Buffer`/`csv-parse` out of the browser build. Verify with
  `grep -l Buffer dist/browser.mjs` (should find nothing) after touching the
  build config.
- **A bare `prettier --write .` reformats the TypeScript too**, fighting
  Biome's formatting and mangling every source file, unless `.prettierignore`
  is doing its job. Prettier is scoped to Markdown/YAML on purpose — if
  `bun run format` ever touches a `.ts` file, `.prettierignore` broke, not
  Biome.
- **`DEFAULT_MACHINE`/`DIST_MACHINE` (`data/machine.json`, `.dist`) didn't
  come over from `washy-washy-cli`'s pre-split `packages/core`, on purpose.**
  They're a filesystem path convention tied to one consumer's directory
  layout, not chart/machine domain logic — and not even a convention every
  consumer actually shares: `washy-washy-web` needed a different one for its
  own test fixtures. If a future ticket asks to re-add them, that's a real
  architecture question (this package doing file I/O/path conventions at
  all), not a missing export to restore reflexively.
- **The `release` job's first-ever run needs a human, twice.** Once for a
  one-time manual `npm publish --access public` from a local machine (npm's
  Trusted Publishing can't be linked before the scoped package exists at all
  — there's no pre-registration path for a brand-new scope), and once more
  to flip that first publish from restricted to public, since a scoped
  package defaults to restricted regardless of `publishConfig.access` in
  `package.json` when published outside CI. Every release after that is
  unattended.
