# @washy-washy/core

[![check](https://github.com/alrayyes/washy-washy-core/actions/workflows/ci.yml/badge.svg)](https://github.com/alrayyes/washy-washy-core/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40washy-washy%2Fcore)](https://www.npmjs.com/package/@washy-washy/core)
[![Codecov](https://codecov.io/gh/alrayyes/washy-washy-core/graph/badge.svg)](https://codecov.io/gh/alrayyes/washy-washy-core)
[![license](https://img.shields.io/github/license/alrayyes/washy-washy-core)](LICENSE)
[![docs](https://img.shields.io/badge/docs-typedoc-blue)](https://alrayyes.github.io/washy-washy-core/)

Chart parsing, machine validation, and mixing rules for
[washy-washy](https://github.com/alrayyes/washy-washy-cli), a laundry chart
generator. This package holds no rendering or file I/O — just the pure logic
a CSV/JSON chart is checked and reasoned about with, shared by the CLI, the
web app, and [`@washy-washy/pdf`](https://github.com/alrayyes/washy-washy-pdf).

**Jump to:** [Browser](#browser) · [Node and Bun (CSV)](#node-and-bun-csv) ·
[What's in it](#whats-in-it) · [Development](#development) ·
[API reference](https://alrayyes.github.io/washy-washy-core/)

## Requirements

- Node.js 18+, Bun, or any other runtime with modern ESM/`exports` map
  support.
- No system packages, no external services, no credentials — this package
  does no file I/O and no network access.

## Install

```sh
npm install @washy-washy/core
```

## Two entry points

| Import                      | Use when                          | Includes                          |
| --------------------------- | --------------------------------- | --------------------------------- |
| `@washy-washy/core/browser` | Bundled for a browser             | Everything except CSV parsing     |
| `@washy-washy/core`         | Node/Bun, reading a CSV from disk | Everything, including CSV parsing |

`@washy-washy/core`'s CSV parser depends on `csv-parse`, which reaches for
Node's `Buffer` at import time even if nothing calls it — a bundler ships
that reference into the client, and it dies at runtime with
`Buffer is not defined`. `@washy-washy/core/browser` excludes it: a browser
consumer reads and writes charts as JSON instead (`chartFromJson`/
`chartToJson`), which needs no such dependency.

## Usage

### Browser

Read and write a chart as JSON instead of CSV — `@washy-washy/core/browser`
has no CSV parser (see [Two entry points](#two-entry-points)).

```ts
import {
  chartFromJson,
  chartToJson,
  parseMachine,
} from "@washy-washy/core/browser";

const machine = parseMachine(machineConfig);
const instructions = chartFromJson(jsonFromStorage, machine);
```

### Node and Bun (CSV)

```ts
import { parseInstructions, parseMachine } from "@washy-washy/core";

const machine = parseMachine(JSON.parse(machineFileContents));
const instructions = parseInstructions(csvFileContents, machine);
```

### What's in it

- Every chart row carries an optional `referenceName`/`referenceLink` pair —
  who to credit for a care instruction that isn't obvious from the garment
  itself ("the manufacturer says wash these alone"), and a link backing it
  up. Both are empty strings when there's nothing to cite.
- **`parseMachine`** validates a machine description (washer programmes,
  temperatures, spins, options; iron thermostat positions) and hands back a
  typed `Machine`. Every failure names the field that's wrong.
- **`parseInstructions`** (CSV) and **`chartFromJson`**/**`chartToJson`**
  (JSON) parse a chart against a `Machine`, rejecting any row that asks for a
  setting the machine doesn't have. `duration` is checked too, against
  `~H:MM` (the `~` is optional) — empty is still fine, for a pile with no
  duration on record.
- **`parseConfig`**/**`configFromJson`**/**`configToJson`** do the same for a
  machine and a chart together, as one `{ machine, chart }` object — the
  chart is always validated against the machine it's embedded with.
  `configToJson`'s output leads with a `$schema` key
  ([`schema/config.schema.json`](schema/config.schema.json), generated from
  the `Config` type, so it can't drift) — an editor that reads it, VS Code
  among them, validates and autocompletes the file with no setup. The output
  is plain `JSON.stringify(..., null, 2)` — if you write it straight to a
  file in a Biome- or Prettier-linted repo, run your own formatter over it
  afterward, since a generic serializer can't match either tool's opinions.
- **`mixBlocker`**/**`canMix`**/**`resolve`** decide whether two piles of
  laundry can share a drum, and why not when they can't.
- **`cardGroups`**/**`washGroups`**/**`ironGroups`** group instructions the
  way a printed chart is laid out: one card per identical setup, a wash-only
  cut, an iron-only cut ordered by thermostat position.

Every exported function and type carries a TSDoc comment with a runnable
example — that's your editor's hover, and it's also the generated
[API reference](https://alrayyes.github.io/washy-washy-core/).
[`@washy-washy/pdf`](https://alrayyes.github.io/washy-washy-pdf/) has the same.

## Development

```sh
bun install
bun run check    # lint, typecheck, test
bun run build    # emit dist/ (tsdown)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and, for how the modules fit together,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

[GPL-3.0-or-later](LICENSE).
