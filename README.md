# @washy-washy/core

Chart parsing, machine validation, and mixing rules for
[washy-washy](https://github.com/alrayyes/washy-washy-cli), a laundry chart
generator. This package holds no rendering or file I/O — just the pure logic
a CSV/JSON chart is checked and reasoned about with, shared by the CLI, the
web app, and [`@washy-washy/pdf`](https://github.com/alrayyes/washy-washy-pdf).

## Install

```sh
npm install @washy-washy/core
```

## Two entry points

| Import                      | Use when                          | Includes                          |
| --------------------------- | --------------------------------- | --------------------------------- |
| `@washy-washy/core`         | Node/Bun, reading a CSV from disk | Everything, including CSV parsing |
| `@washy-washy/core/browser` | Bundled for a browser             | Everything except CSV parsing     |

`@washy-washy/core`'s CSV parser depends on `csv-parse`, which reaches for
Node's `Buffer` at import time even if nothing calls it — a bundler ships
that reference into the client and it dies at runtime with
`Buffer is not defined`. `@washy-washy/core/browser` excludes it: a browser
consumer reads and writes charts as JSON instead (`chartFromJson`/
`chartToJson`), which needs no such dependency.

## Usage

```ts
import { parseInstructions, parseMachine } from "@washy-washy/core";

const machine = parseMachine(JSON.parse(machineFileContents));
const instructions = parseInstructions(csvFileContents, machine);
```

```ts
// In a browser bundle: read/write a chart as JSON instead of CSV.
import {
  chartFromJson,
  chartToJson,
  parseMachine,
} from "@washy-washy/core/browser";

const machine = parseMachine(machineConfig);
const instructions = chartFromJson(jsonFromStorage, machine);
```

### What's in it

- **`parseMachine`** validates a machine description (washer programmes,
  temperatures, spins, options; iron thermostat positions) and hands back a
  typed `Machine`. Every failure names the field that's wrong.
- **`parseInstructions`** (CSV) and **`chartFromJson`**/**`chartToJson`**
  (JSON) parse a chart against a `Machine`, rejecting any row that asks for a
  setting the machine doesn't have.
- **`mixBlocker`**/**`canMix`**/**`resolve`** decide whether two piles of
  laundry can share a drum, and why not when they can't.
- **`cardGroups`**/**`washGroups`**/**`ironGroups`** group instructions the
  way a printed chart is laid out: one card per identical setup, a wash-only
  cut, an iron-only cut ordered by thermostat position.

Every exported function and type carries a TSDoc comment — the full API
reference is your editor's hover, not a separate generated site.

## Development

```sh
bun install
bun run check    # lint, typecheck, test
bun run build    # emit dist/ (tsdown)
```

See [CONTRIBUTING.md](CONTRIBUTING.md).
