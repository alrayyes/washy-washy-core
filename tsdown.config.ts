import { defineConfig } from "tsdown";

// One build. Both of package.json's exports, "." and "./browser", point at it:
// nothing in src/ needs Node, and CI fails the build if that changes.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
