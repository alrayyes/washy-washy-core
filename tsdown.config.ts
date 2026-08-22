import { defineConfig } from "tsdown";

// Two entry points, matching the package's two exports: "." is the full
// surface (pulls in csv-parse, which reaches for Node's Buffer at import
// time), "./browser" is everything except csv.ts, safe for a bundled
// client. Keeping them as separate builds — not one bundle with two
// exports pointing into it — is what keeps Buffer out of the browser one.
export default defineConfig({
  entry: { index: "src/index.ts", browser: "src/browser.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
