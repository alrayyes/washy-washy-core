import { describe, expect, test } from "bun:test";
import { formatTemperature, ironSetting, parseMachine } from "../src/index";

const MINIMAL = {
  washer: {
    name: "Test Washer",
    capacity: "1–8 kg",
    programs: ["Off", "Cottons", "Wool"],
    temperatures: ["cold", "30", "60"],
    spins: ["0", "800"],
    options: ["Eco"],
  },
  iron: {
    name: "Test Iron",
    settings: [
      { key: "min", dots: "", label: "MIN", detail: "no heat", steam: false },
      { key: "1", dots: "•", label: "•", detail: "synthetics", steam: false },
      { key: "2", dots: "••", label: "••", detail: "wool", steam: true },
    ],
  },
};

describe("parseMachine", () => {
  test("takes a machine described entirely in data", () => {
    const machine = parseMachine(MINIMAL);

    expect(machine.washer.programs).toEqual(["Off", "Cottons", "Wool"]);
    expect(machine.iron.settings).toHaveLength(3);
  });

  // The dial angles come from the order of this list, so a missing programme
  // does not just omit a tick — it moves every other one.
  test("insists the dial has positions to draw", () => {
    const noPrograms = {
      ...MINIMAL,
      washer: { ...MINIMAL.washer, programs: [] },
    };
    expect(() => parseMachine(noPrograms)).toThrow(/programs/);
  });

  test("insists on the parts a card cannot be drawn without", () => {
    expect(() => parseMachine({ washer: MINIMAL.washer })).toThrow(/iron is missing/);
    expect(() => parseMachine({ iron: MINIMAL.iron })).toThrow(/washer is missing/);
  });

  test("rejects a value that isn't an object at all", () => {
    expect(() => parseMachine("not a machine at all")).toThrow(/the file must contain an object/);
  });

  test("rejects a null machine value the same as any other non-object", () => {
    expect(() => parseMachine(null)).toThrow(/the file must contain an object/);
  });

  test("rejects a null washer or iron rather than treating it as missing", () => {
    expect(() => parseMachine({ washer: null, iron: MINIMAL.iron })).toThrow(/washer is missing/);
    expect(() => parseMachine({ washer: MINIMAL.washer, iron: null })).toThrow(/iron is missing/);
  });

  test("rejects a dial list that isn't an array", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, programs: "Cottons" } };
    expect(() => parseMachine(bad)).toThrow(/washer\.programs must be a list of non-empty strings/);
  });

  test("rejects a dial list containing a non-string entry", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, programs: ["Cottons", 5] } };
    expect(() => parseMachine(bad)).toThrow(/washer\.programs must be a list of non-empty strings/);
  });

  test("rejects a dial list containing an empty string entry", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, programs: ["Cottons", ""] } };
    expect(() => parseMachine(bad)).toThrow(/washer\.programs must be a list of non-empty strings/);
  });

  test("rejects a dial list with a duplicate entry", () => {
    const dup = {
      ...MINIMAL,
      washer: { ...MINIMAL.washer, programs: [...MINIMAL.washer.programs, "Cottons"] },
    };
    expect(() => parseMachine(dup)).toThrow(/washer\.programs repeats a value/);
  });

  test("accepts a dial entry exactly at its length cap", () => {
    const atCap = {
      ...MINIMAL,
      washer: { ...MINIMAL.washer, programs: [...MINIMAL.washer.programs, "x".repeat(32)] },
    };
    expect(() => parseMachine(atCap)).not.toThrow();
  });

  test("names the field when washer options are invalid", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, options: [""] } };
    expect(() => parseMachine(bad)).toThrow(/washer\.options must be a list of non-empty strings/);
  });

  test("names the field when washer spins are invalid", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, spins: [] } };
    expect(() => parseMachine(bad)).toThrow(/washer\.spins needs at least 1 entr/);
  });

  test("rejects a washer or iron name that isn't a string", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, name: 42 } };
    expect(() => parseMachine(bad as never)).toThrow(/washer\.name must be a non-empty string/);
  });

  test("rejects a washer name that is an empty string", () => {
    const bad = { ...MINIMAL, washer: { ...MINIMAL.washer, name: "" } };
    expect(() => parseMachine(bad)).toThrow(/washer\.name must be a non-empty string/);
  });

  test("accepts a washer name exactly at its length cap", () => {
    const atCap = { ...MINIMAL, washer: { ...MINIMAL.washer, name: "x".repeat(60) } };
    expect(() => parseMachine(atCap)).not.toThrow();
  });

  test("defaults washer capacity to empty when the field is omitted", () => {
    const { capacity: _capacity, ...washerWithoutCapacity } = MINIMAL.washer;
    const machine = parseMachine({ ...MINIMAL, washer: washerWithoutCapacity });
    expect(machine.washer.capacity).toBe("");
  });

  test("defaults washer options to an empty list when the field is omitted", () => {
    const { options: _options, ...washerWithoutOptions } = MINIMAL.washer;
    const machine = parseMachine({ ...MINIMAL, washer: washerWithoutOptions });
    expect(machine.washer.options).toEqual([]);
  });

  test("rejects an iron name too long, naming the field", () => {
    const tooLong = { ...MINIMAL, iron: { ...MINIMAL.iron, name: "x".repeat(61) } };
    expect(() => parseMachine(tooLong)).toThrow(/iron\.name.*61/);
  });

  test("insists iron.settings is present and a list", () => {
    const bad = { ...MINIMAL, iron: { name: "Test Iron" } };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings is missing/);
  });

  test("insists the iron ring has at least two positions", () => {
    const bad = { ...MINIMAL, iron: { ...MINIMAL.iron, settings: [MINIMAL.iron.settings[0]] } };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings needs at least 2 positions/);
  });

  test("rejects an iron with two settings sharing a key", () => {
    const bad = {
      ...MINIMAL,
      iron: { ...MINIMAL.iron, settings: [MINIMAL.iron.settings[0], MINIMAL.iron.settings[0]] },
    };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings repeats a key/);
  });

  test("rejects an iron setting that isn't an object", () => {
    const bad = {
      ...MINIMAL,
      iron: { ...MINIMAL.iron, settings: [...MINIMAL.iron.settings, "not an object"] },
    };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings\[3\] must be an object/);
  });

  test("rejects a null iron setting", () => {
    const bad = {
      ...MINIMAL,
      iron: { ...MINIMAL.iron, settings: [...MINIMAL.iron.settings, null] },
    };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings\[3\] must be an object/);
  });

  test("rejects an iron setting missing a key", () => {
    const bad = {
      ...MINIMAL,
      iron: { ...MINIMAL.iron, settings: [...MINIMAL.iron.settings, { label: "x" }] },
    };
    expect(() => parseMachine(bad)).toThrow(/iron\.settings\[3\]\.key must be a non-empty string/);
  });

  test("defaults an iron setting's detail to empty when omitted", () => {
    const machine = parseMachine({
      ...MINIMAL,
      iron: { ...MINIMAL.iron, settings: [...MINIMAL.iron.settings, { key: "3", label: "x" }] },
    });
    expect(machine.iron.settings[3]?.detail).toBe("");
  });

  test("rejects an iron setting's detail too long for its slot", () => {
    const tooLong = {
      ...MINIMAL,
      iron: {
        ...MINIMAL.iron,
        settings: [...MINIMAL.iron.settings, { key: "3", label: "x", detail: "x".repeat(61) }],
      },
    };
    expect(() => parseMachine(tooLong)).toThrow(/iron\.settings\[3\]\.detail.*61/);
  });

  test("accepts a dot string exactly at the dial convention's cap", () => {
    const atCap = {
      ...MINIMAL,
      iron: {
        ...MINIMAL.iron,
        settings: [...MINIMAL.iron.settings, { key: "3", dots: "x".repeat(5), label: "x" }],
      },
    };
    expect(() => parseMachine(atCap)).not.toThrow();
  });

  test("carries the iron's steam capability through per setting", () => {
    const machine = parseMachine(MINIMAL);
    expect(machine.iron.settings.map((setting) => setting.steam)).toEqual([false, false, true]);
  });

  /**
   * There used to be a reserved key here: a setting called "none" was refused,
   * because "none" was how a row said do not iron this. The `ironing` boolean
   * carries that now, so every key a fascia might print is available again.
   */
  test("allows a thermostat position called none", () => {
    const named = {
      ...MINIMAL,
      iron: {
        ...MINIMAL.iron,
        settings: [...MINIMAL.iron.settings, { key: "none", label: "x", detail: "", steam: false }],
      },
    };
    expect(parseMachine(named).iron.settings.map((setting) => setting.key)).toContain("none");
  });

  // Caps chosen from @washy-washy/pdf's actual fixed-width slots (dial
  // captions, the reference-sheet's thermostat column, chip rows) — long
  // enough for anything a real fascia prints, short enough that a card or
  // sheet never has to guess how to fit one.
  test("rejects a washer or iron name too long for its label", () => {
    const tooLong = { ...MINIMAL, washer: { ...MINIMAL.washer, name: "x".repeat(61) } };
    expect(() => parseMachine(tooLong)).toThrow(/washer\.name.*61/);
  });

  test("rejects a dial entry too long to fit its slot", () => {
    const tooLong = {
      ...MINIMAL,
      washer: { ...MINIMAL.washer, programs: [...MINIMAL.washer.programs, "x".repeat(33)] },
    };
    expect(() => parseMachine(tooLong)).toThrow(/washer\.programs/);
  });

  // Raised from the original 20/12: washy-washy-web's bundled locale
  // content needed up to 28/14 chars, and washy-washy-pdf 2.3.7 confirmed
  // by rendering probe PDFs that both slots have room past that — capacity
  // renders on the full-width masthead line, and a real bug in the
  // reference sheet's °C column (washy-washy-pdf#61) was fixed to make
  // room for temperatures.
  test("rejects a washer capacity too long for the masthead line", () => {
    const tooLong = { ...MINIMAL, washer: { ...MINIMAL.washer, capacity: "x".repeat(31) } };
    expect(() => parseMachine(tooLong)).toThrow(/washer\.capacity.*31/);
  });

  test("rejects a temperature entry too long for the reference sheet's °C column", () => {
    const tooLong = {
      ...MINIMAL,
      washer: { ...MINIMAL.washer, temperatures: [...MINIMAL.washer.temperatures, "x".repeat(16)] },
    };
    expect(() => parseMachine(tooLong)).toThrow(/washer\.temperatures/);
  });

  test("rejects a thermostat label too long for the tightest slot in the renderer", () => {
    const tooLong = {
      ...MINIMAL,
      iron: {
        ...MINIMAL.iron,
        settings: [...MINIMAL.iron.settings, { key: "3", dots: "•••", label: "x".repeat(21) }],
      },
    };
    expect(() => parseMachine(tooLong)).toThrow(/iron\.settings\[3\]\.label/);
  });

  test("rejects a dot string longer than the dial convention uses", () => {
    const tooLong = {
      ...MINIMAL,
      iron: {
        ...MINIMAL.iron,
        settings: [...MINIMAL.iron.settings, { key: "3", dots: "••••••", label: "x" }],
      },
    };
    expect(() => parseMachine(tooLong)).toThrow(/iron\.settings\[3\]\.dots/);
  });
});

describe("ironSetting", () => {
  test("finds a position by the key a row writes", () => {
    const machine = parseMachine(MINIMAL);
    expect(ironSetting(machine, "2")?.label).toBe("••");
    expect(ironSetting(machine, "nope")).toBeUndefined();
  });
});

describe("formatTemperature", () => {
  test("adds a degree sign to a numeric temperature", () => {
    expect(formatTemperature("40")).toBe("40°");
  });

  test("leaves a non-numeric temperature untouched", () => {
    expect(formatTemperature("cold")).toBe("cold");
  });

  test("does not add a degree sign unless the entire value is numeric", () => {
    expect(formatTemperature("x40")).toBe("x40");
    expect(formatTemperature("40x")).toBe("40x");
  });
});
