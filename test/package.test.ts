import { describe, expect, test } from "bun:test";
import manifest from "../package.json";
import * as core from "../src/index";

describe("the published package", () => {
  test("has no runtime dependencies", () => {
    expect(manifest).not.toHaveProperty("dependencies");
  });

  // web and pdf import from "./browser", so the path outlives the separate
  // build it used to point at.
  test("serves the root build from the /browser path too", () => {
    expect(manifest.exports["./browser"]).toEqual(manifest.exports["."]);
  });

  test("has no CSV parser", () => {
    expect(core).not.toHaveProperty("parseInstructions");
  });
});
