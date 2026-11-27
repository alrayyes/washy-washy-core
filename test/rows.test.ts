import { describe, expect, test } from "bun:test";
import {
  chartFromJson,
  chartToJson,
  type Instruction,
  instructionsFromRows,
  parseMachine,
  type Row,
  rowsFromInstructions,
} from "../src/index";

// Covers every value the tests below exercise: valid and invalid programs,
// temperatures, spins, options and an iron setting.
const machine = parseMachine({
  washer: {
    name: "Test Washer",
    capacity: "",
    programs: ["Cottons", "Wool"],
    temperatures: ["cold", "30", "60"],
    spins: ["400", "800", "1200"],
    options: ["Extra Rinse", "Eco"],
  },
  iron: {
    name: "Test Iron",
    settings: [
      { key: "1", dots: "•", label: "•", detail: "", steam: false },
      { key: "2", dots: "••", label: "••", detail: "", steam: true },
    ],
  },
});

const ROW: Row = {
  clothing_type: "Dark",
  detergent: "Dark liquid",
  fabric_softener: "no",
  temperature: "30",
  spin: "800",
  duration: "~2:00",
  program: "Cottons",
  options: "Extra Rinse",
  ironing: "yes",
  ironing_notes: "Inside out",
  iron_setting: "2",
  drying: "Line dry",
  colour_group: "dark",
  mix_tags: "dye-bleeder",
  notes: "",
  reference_name: "",
  reference_link: "",
};

/** One valid row, with whatever the test cares about swapped out. */
function rows(overrides: Partial<Row> = {}): Row[] {
  return [{ ...ROW, ...overrides }];
}

function parse(overrides: Partial<Row> = {}): Instruction[] {
  return instructionsFromRows(rows(overrides), machine);
}

describe("instructionsFromRows", () => {
  test("reads a row into an instruction", () => {
    const [item] = parse();
    expect(item).toMatchObject({
      clothingType: "Dark",
      fabricSoftener: false,
      temperature: "30",
      spin: "800",
      program: "Cottons",
      options: ["Extra Rinse"],
      ironSetting: "2",
      colourGroup: "dark",
      mixTags: ["dye-bleeder"],
    });
  });

  test("splits pipe-separated options and tags", () => {
    const [item] = parse({ options: "Eco|Extra Rinse", mix_tags: "solo|dye-bleeder" });
    expect(item?.options).toEqual(["Eco", "Extra Rinse"]);
    expect(item?.mixTags).toEqual(["solo", "dye-bleeder"]);
  });

  test("trims whitespace around pipe-separated values", () => {
    const [item] = parse({ options: " Extra Rinse | Eco " });
    expect(item?.options).toEqual(["Extra Rinse", "Eco"]);
  });

  test("accepts an empty options cell", () => {
    const [item] = parse({ options: "" });
    expect(item?.options).toEqual([]);
  });

  test("rejects a programme the dial does not have", () => {
    expect(() => parse({ program: "Turbo Wash" })).toThrow(/row 2, column "program"/);
  });

  test("counts rows from the line after a header", () => {
    expect(() => instructionsFromRows([ROW, { ...ROW, program: "Turbo Wash" }], machine)).toThrow(
      /row 3, column "program"/,
    );
  });

  test("lists every allowed value, comma-separated, when rejecting one", () => {
    expect(() => parse({ program: "Turbo Wash" })).toThrow(
      /"Turbo Wash" is not one of Cottons, Wool/,
    );
  });

  test("names thrown row errors 'RowError' for callers that branch on it", () => {
    try {
      parse({ program: "Turbo Wash" });
      throw new Error("expected instructionsFromRows to throw");
    } catch (error) {
      expect((error as Error).name).toBe("RowError");
    }
  });

  test.each([
    ["a temperature the machine cannot be set to", "temperature", "35"],
    ["a spin speed the machine cannot be set to", "spin", "900"],
    ["an option button that does not exist", "options", "Turbo"],
    ["an unknown mix tag", "mix_tags", "smelly"],
    ["a non yes/no softener value", "fabric_softener", "maybe"],
  ] as const)("rejects %s", (_, column, value) => {
    expect(() => parse({ [column]: value })).toThrow(new RegExp(`column "${column}"`));
  });

  test("tolerates surrounding whitespace and mixed case in yes/no values", () => {
    const [item] = parse({ fabric_softener: " YES " });
    expect(item?.fabricSoftener).toBe(true);
  });

  test.each(["yes", "y", "true", "1"])("recognises %s as a yes/no true value", (token) => {
    const [item] = parse({ fabric_softener: token });
    expect(item?.fabricSoftener).toBe(true);
  });

  test.each(["no", "n", "false", "0"])("recognises %s as a yes/no false value", (token) => {
    const [item] = parse({ fabric_softener: token });
    expect(item?.fabricSoftener).toBe(false);
  });

  test("rejects a duration that doesn't match H:MM", () => {
    expect(() => parse({ duration: "banana" })).toThrow(
      /column "duration": must match H:MM, found "banana"/,
    );
  });

  test("leaves the duration empty when a row doesn't give one", () => {
    const [item] = parse({ duration: "" });
    expect(item?.duration).toBe("");
  });

  test("accepts a duration with no leading tilde", () => {
    const [item] = parse({ duration: "2:00" });
    expect(item?.duration).toBe("2:00");
  });

  test("rejects a duration with trailing characters after the minutes", () => {
    expect(() => parse({ duration: "2:00pm" })).toThrow(/column "duration": must match H:MM/);
  });

  test("rejects a duration whose digits don't start at the beginning of the value", () => {
    expect(() => parse({ duration: "at 2:00" })).toThrow(/column "duration": must match H:MM/);
  });

  test("reads an optional reference name and link", () => {
    const link =
      "https://www.which.co.uk/reviews/washing-machines/article/washing-machine-temperature-guide-aLiyf2p96y4d";
    const [item] = parse({ reference_name: "Which?", reference_link: link });
    expect(item?.referenceName).toBe("Which?");
    expect(item?.referenceLink).toBe(link);
  });

  test("leaves the reference empty when a row doesn't cite one", () => {
    const [item] = parse();
    expect(item?.referenceName).toBe("");
    expect(item?.referenceLink).toBe("");
  });

  test("rejects a blank clothing type", () => {
    expect(() => parse({ clothing_type: "" })).toThrow(/column "clothing_type"/);
  });

  test("names every column it is missing, comma-separated", () => {
    const partial = { clothing_type: "Dark", detergent: "Dark liquid" };
    expect(() => instructionsFromRows([partial], machine)).toThrow(
      /missing column\(s\): fabric_softener, temperature/,
    );
  });

  /**
   * Caps taken from @washy-washy/pdf's actual layout: fixed-width slots
   * (clothingType) get a tight ceiling with headroom to spare, free-flowing
   * prose (ironingNotes, notes, drying, reference fields) gets a generous
   * one that's purely a bad-data backstop rather than a wrap-safety limit —
   * these fields wrap fully regardless of length.
   */
  describe("free-text length limits", () => {
    test.each([
      ["clothing_type", 60],
      ["detergent", 200],
      ["ironing_notes", 400],
      // Raised from the original 150/500: real bundled locale content
      // (washy-washy-web's German translations) needed up to 224/559 chars,
      // and washy-washy-pdf 2.3.7 confirmed by rendering probe PDFs that
      // free-flowing prose has headroom well past that.
      ["drying", 230],
      ["notes", 570],
      ["reference_name", 80],
      ["reference_link", 2048],
    ] as const)("rejects %s past its %i-character limit", (column, max) => {
      expect(() => parse({ [column]: "x".repeat(max + 1) })).toThrow(
        new RegExp(`column "${column}".*must be at most ${max} characters`),
      );
    });

    test("rejects a duration too long even in valid H:MM shape", () => {
      // 9 digits before the colon: same H:MM pattern, one character past the cap.
      expect(() => parse({ duration: `~${"9".repeat(9)}:59` })).toThrow(
        /column "duration".*must be at most 12 characters/,
      );
    });

    test("accepts a value right at the limit", () => {
      const [item] = parse({ notes: "x".repeat(570) });
      expect(item?.notes).toHaveLength(570);
    });
  });

  /**
   * `ironing` and `iron_setting` describe one decision between them, so the
   * parser is where they are held to agreeing. Letting them drift is how you
   * get a card with a crossed-out iron and a thermostat position on it.
   */
  describe("ironing and its thermostat", () => {
    const noIron = (setting = "", notes = "") =>
      parse({ ironing: "no", ironing_notes: notes, iron_setting: setting });

    test("reads the boolean and keeps the notes apart from it", () => {
      const [item] = parse();
      expect(item?.ironing).toBe(true);
      expect(item?.ironingNotes).toBe("Inside out");
      expect(item?.ironSetting).toBe("2");
    });

    test("leaves the thermostat empty for a pile you never iron", () => {
      const [item] = noIron();
      expect(item?.ironing).toBe(false);
      expect(item?.ironSetting).toBe("");
    });

    test("still takes notes on a pile you never iron", () => {
      const [item] = noIron("", "Melts");
      expect(item?.ironing).toBe(false);
      expect(item?.ironingNotes).toBe("Melts");
    });

    test("refuses a thermostat position on a pile you never iron", () => {
      expect(() => noIron("3")).toThrow(/column "iron_setting".*empty when ironing is no/);
    });

    test("insists on a thermostat position for a pile you do iron", () => {
      expect(() => parse({ iron_setting: "" })).toThrow(/column "iron_setting"/);
    });

    test("refuses a thermostat position the iron does not have", () => {
      expect(() => parse({ iron_setting: "9" })).toThrow(/column "iron_setting".*not one of/);
    });

    test("refuses an ironing value that is not yes or no", () => {
      expect(() => parse({ ironing: "maybe" })).toThrow(/column "ironing".*yes\/no/);
    });
  });
});

describe("the JSON chart format", () => {
  test("round-trips a chart without losing or changing anything", () => {
    const original = parse();
    const roundTripped = chartFromJson(chartToJson(original), machine);
    expect(roundTripped).toEqual(original);
  });

  test("rejects a JSON chart that is not an array", () => {
    expect(() => chartFromJson("{}", machine)).toThrow(/must be a JSON array/);
  });

  test("rejects a JSON chart that is not valid JSON", () => {
    expect(() => chartFromJson("not json", machine)).toThrow(/not valid JSON/);
  });

  test("applies the same machine-facing validation as rows passed directly", () => {
    const [row] = JSON.parse(chartToJson(parse()));
    row.program = "Turbo Wash";
    expect(() => chartFromJson(JSON.stringify([row]), machine)).toThrow(/column "program"/);
  });

  test("rejects an empty JSON chart", () => {
    expect(() => chartFromJson("[]", machine)).toThrow(/the chart has no rows/);
  });

  test("uses a pipe to separate multiple options and tags in the JSON chart", () => {
    const instructions = parse({ options: "Eco|Extra Rinse", mix_tags: "solo|dye-bleeder" });
    const [parsedRow] = JSON.parse(chartToJson(instructions));
    expect(parsedRow.options).toBe("Eco|Extra Rinse");
    expect(parsedRow.mix_tags).toBe("solo|dye-bleeder");
  });
});

describe("rowsFromInstructions", () => {
  function instruction(overrides: Partial<Instruction> = {}): Instruction {
    return {
      clothingType: "Dark",
      detergent: "",
      fabricSoftener: false,
      temperature: "30",
      spin: "800",
      duration: "",
      program: "Cottons",
      options: [],
      ironing: false,
      ironingNotes: "",
      ironSetting: "",
      drying: "",
      colourGroup: "dark",
      mixTags: [],
      notes: "",
      referenceName: "",
      referenceLink: "",
      ...overrides,
    };
  }

  test("writes 'no' for a false fabric softener or ironing flag, not blank", () => {
    const [row] = rowsFromInstructions([instruction({ fabricSoftener: false, ironing: false })]);
    expect(row?.fabric_softener).toBe("no");
    expect(row?.ironing).toBe("no");
  });

  test("writes 'yes' for a true fabric softener or ironing flag", () => {
    const [row] = rowsFromInstructions([instruction({ fabricSoftener: true, ironing: true })]);
    expect(row?.fabric_softener).toBe("yes");
    expect(row?.ironing).toBe("yes");
  });
});

describe("fields the schema allows to be entirely absent from a row", () => {
  // The `?? ""` fallbacks only ever fire for a row object built by hand or
  // read from a source where a value was left out. `withMissing` keeps the key present — the
  // header check cares about key presence, not value — but sets its value
  // to `undefined`, the only way to reach the fallback.
  const UNIRONED: Row = { ...ROW, ironing: "no", iron_setting: "" };

  function withMissing(column: string): Row {
    return { ...UNIRONED, [column]: undefined } as unknown as Row;
  }

  test("trims whitespace from the clothing type", () => {
    const [item] = instructionsFromRows([{ ...ROW, clothing_type: "  Dark  " }], machine);
    expect(item?.clothingType).toBe("Dark");
  });

  test("rejects a missing clothing type the same as an empty one", () => {
    expect(() => instructionsFromRows([withMissing("clothing_type")], machine)).toThrow(
      /clothing_type.*must not be empty/,
    );
  });

  test("defaults free-text fields to empty rather than a placeholder when missing", () => {
    expect(instructionsFromRows([withMissing("detergent")], machine)[0]?.detergent).toBe("");
    expect(instructionsFromRows([withMissing("ironing_notes")], machine)[0]?.ironingNotes).toBe("");
    expect(instructionsFromRows([withMissing("drying")], machine)[0]?.drying).toBe("");
    expect(instructionsFromRows([withMissing("notes")], machine)[0]?.notes).toBe("");
    expect(instructionsFromRows([withMissing("reference_name")], machine)[0]?.referenceName).toBe(
      "",
    );
    expect(instructionsFromRows([withMissing("reference_link")], machine)[0]?.referenceLink).toBe(
      "",
    );
  });

  test("defaults duration to empty when the field is missing", () => {
    expect(instructionsFromRows([withMissing("duration")], machine)[0]?.duration).toBe("");
  });

  test("treats a missing options cell as no options selected", () => {
    expect(instructionsFromRows([withMissing("options")], machine)[0]?.options).toEqual([]);
  });

  test("treats a missing mix_tags cell as no tags selected", () => {
    expect(instructionsFromRows([withMissing("mix_tags")], machine)[0]?.mixTags).toEqual([]);
  });

  test("defaults the iron setting to empty when missing and the pile isn't ironed", () => {
    expect(instructionsFromRows([withMissing("iron_setting")], machine)[0]?.ironSetting).toBe("");
  });

  test("trims whitespace from the iron setting position", () => {
    const [item] = instructionsFromRows([{ ...ROW, ironing: "yes", iron_setting: " 2 " }], machine);
    expect(item?.ironSetting).toBe("2");
  });

  test.each([
    ["temperature", /column "temperature": "" is not one of/],
    ["spin", /column "spin": "" is not one of/],
    ["program", /column "program": "" is not one of/],
    ["colour_group", /column "colour_group": "" is not one of/],
    ["fabric_softener", /column "fabric_softener": "" is not a yes\/no value/],
    ["ironing", /column "ironing": "" is not a yes\/no value/],
  ] as const)("rejects a missing %s the same as an empty one", (column, expected) => {
    expect(() => instructionsFromRows([withMissing(column)], machine)).toThrow(expected);
  });
});
