// @stryker-mutator/core has no official Bun runner yet (open upstream
// request). `@hughescr/stryker-bun-runner` is chosen over
// `stryker-mutator-bun-runner` (npm's `latest` is 0.4.0, published
// 2025-07-07, peer-pinned to `@stryker-mutator/core ^9.0.0`, ~2 open
// issues/7 PRs suggesting stalled maintenance) and over falling back to
// `@stryker-mutator/jest-runner` (this repo's suite imports from
// "bun:test", which doesn't exist outside the Bun runtime — running it
// under real Jest would mean rewriting every test file, not a drop-in
// fallback). `@hughescr/stryker-bun-runner` ships frequent releases (18
// versions between January and July 2026, latest 1.3.8) and is built
// specifically for `bun:test` per-test coverage via Bun's Inspector
// Protocol. See the PR description for the full evaluation.
//
// `@stryker-mutator/core` is pinned to 9.6.1, not the current 10.0.0:
// both community Bun runners still peer-depend on `^9.0.0`
// (`@stryker-mutator/core@10.0.0` shipped 2026-08-14, after either
// runner's last release), and `inPlace: true` below is required for an
// unrelated reason — see that option's comment.
/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  // Stryker's default plugin glob is "@stryker-mutator/*" — the bun runner
  // lives outside that scope, so it has to be named explicitly.
  plugins: ["@hughescr/stryker-bun-runner"],
  testRunner: "bun",
  coverageAnalysis: "perTest",
  // Required here, not a preference: this repo's `typescript` (7.0.2, the
  // native/Go rewrite) exports almost nothing from its classic JS API
  // (`require("typescript")` has exactly two keys: `version` and
  // `versionMajorMinor` — confirmed empirically). Stryker core's own
  // sandbox step (`TSConfigPreprocessor`, unconditional whenever
  // `inPlace` is false) calls `ts.parseConfigFileTextToJson`, which no
  // longer exists, and crashes before a single mutant runs. `inPlace`
  // skips that step entirely, mutating the working tree directly
  // (reverted automatically, mutant by mutant) instead of a sandbox
  // copy. This also rules out `@stryker-mutator/typescript-checker` for
  // now — it depends on the same missing compiler API — so it's not a
  // devDependency here.
  inPlace: true,
  mutate: ["src/**/*.ts"],
  thresholds: {
    high: 100,
    low: 100,
    break: 100,
  },
  reporters: ["html", "clear-text", "progress"],
};
