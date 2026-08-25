import { describe, expect, test } from "bun:test";
import { ironSetting, parseMachine } from "../src/index";

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
    expect(() => parseMachine({ washer: MINIMAL.washer })).toThrow(/iron/);
    expect(() => parseMachine({ iron: MINIMAL.iron })).toThrow(/washer/);
    expect(() => parseMachine("not a machine at all")).toThrow();
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
