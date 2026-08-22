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
});

describe("ironSetting", () => {
  test("finds a position by the key a row writes", () => {
    const machine = parseMachine(MINIMAL);
    expect(ironSetting(machine, "2")?.label).toBe("••");
    expect(ironSetting(machine, "nope")).toBeUndefined();
  });
});
