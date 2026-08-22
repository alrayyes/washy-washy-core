import { describe, expect, test } from "bun:test";
import { durationsOf, type Instruction } from "../src/index";

function pile(overrides: Partial<Instruction> = {}): Instruction {
  return {
    clothingType: "Test",
    detergent: "",
    fabricSoftener: false,
    temperature: "40",
    spin: "1200",
    duration: "~2:00",
    program: "Katoen",
    options: [],
    ironing: false,
    ironingNotes: "",
    ironSetting: "",
    drying: "",
    colourGroup: "colour",
    mixTags: [],
    notes: "",
    ...overrides,
  };
}

describe("durationsOf", () => {
  test("says it once when the piles agree", () => {
    expect(durationsOf([pile(), pile()])).toBe("~2:00");
  });

  test("prints both rather than picking one when they disagree", () => {
    expect(durationsOf([pile(), pile({ duration: "~1:10" })])).toBe("~2:00 / ~1:10");
  });

  test("skips a pile that gives no duration at all", () => {
    expect(durationsOf([pile({ duration: "" }), pile()])).toBe("~2:00");
  });
});
