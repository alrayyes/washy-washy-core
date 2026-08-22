/**
 * Everything in this package that runs in a browser: machine validation,
 * mixing rules, row (de)serialization and validation, and the shared types.
 * Not `csv.ts` — it, and the `index.ts` barrel that includes it, pull in
 * `csv-parse`, which reaches for Node's `Buffer` at import time even when
 * nothing calls it, so a bundler ships it into the client and it dies on
 * `Buffer is not defined`. CSV parsing specifically is a build-time/CLI
 * concern; `rows.ts`'s JSON side of the same validation (`chartFromJson`,
 * `chartToJson`) has no such dependency and is what a browser consumer's
 * upload/download uses instead.
 */
export * from "./machine";
export * from "./mixing";
export * from "./rows";
export * from "./types";
