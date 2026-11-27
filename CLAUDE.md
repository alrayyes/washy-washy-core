<!--
Maintainer note (stripped before this file enters context).
Keep this short and only about what the code cannot say for itself.
-->

# @washy-washy/core

Chart parsing, machine validation and mixing rules — extracted from
`alrayyes/washy-washy-cli`'s `packages/core`. No file I/O, no Bun/Node-only
APIs, no runtime dependencies.

## Gotchas

- **The whole package has to run in a browser.** `washy-washy-web` and
  `washy-washy-pdf` bundle it, so nothing in `src/` may reach for Node,
  directly or through a dependency. CI's `build` job fails if `dist/` imports
  anything or mentions `Buffer`, `process` or `require`. There's no CSV parser
  for that reason among others: it was removed in 2.0.0 (#147).
- **This package has no file I/O.** Reading a machine or chart file from
  disk is a consumer's job (see `washy-washy-cli`'s `src/machine.ts` for the
  Bun-only adapter that wraps `parseMachine`). Adding `fs`/`Bun.file` calls
  here would break it in a browser and the whole point of splitting this
  out.
- **The published tarball ships only `dist/`, `schema/`, `README.md`,
  `LICENSE`** — see `files` in `package.json`. `npm pack --dry-run` before a
  release if you've touched that field or `tsdown.config.ts`.
- **`schema/config.schema.json` is generated, never hand-edited.** `bun run
schema` regenerates it from the `Config` type via
  `ts-json-schema-generator`; `lint:schema` (part of `check`) fails on any
  diff. Change `Config`'s shape, run the script, commit both.
- **One build, two import paths.** `@washy-washy/core/browser` resolves to the
  same files as `@washy-washy/core`. It was a separate build until 2.0.0, and
  web and pdf still import it, so don't drop the export.
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
- **`configToJson`'s output is plain `JSON.stringify(..., null, 2)`, not
  Biome-formatted.** A consumer that writes its result straight to a file in
  a Biome-linted repo gets an immediate lint failure — short arrays that
  Biome collapses onto one line come out one-per-line instead. Not a bug to
  fix here: matching a specific formatter's opinions in a generic
  serializer would be fragile. The fix is on the consumer's side — pipe the
  written file through its own formatter after writing, same as `bun run
schema` does for `schema/config.schema.json` in this repo. Confirmed by
  `washy-washy-cli` hitting this for real in its migration script.
- **The `release` job's first-ever run needs a human, twice.** Once for a
  one-time manual `npm publish --access public` from a local machine (npm's
  Trusted Publishing can't be linked before the scoped package exists at all
  — there's no pre-registration path for a brand-new scope), and once more
  to flip that first publish from restricted to public, since a scoped
  package defaults to restricted regardless of `publishConfig.access` in
  `package.json` when published outside CI. Every release after that is
  unattended.
