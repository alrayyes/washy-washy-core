import { describe, expect, test } from "bun:test";
import { configFromJson, configToJson, parseConfig } from "../src/index";

const MACHINE = {
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
};

const ROW = {
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
};

function config(overrides: { machine?: unknown; chart?: unknown } = {}) {
  return { machine: MACHINE, chart: [ROW], ...overrides };
}

describe("parseConfig", () => {
  test("parses a machine and a chart validated against it", () => {
    const parsed = parseConfig(config());
    expect(parsed.machine.washer.name).toBe("Test Washer");
    expect(parsed.chart).toHaveLength(1);
    expect(parsed.chart[0]).toMatchObject({ clothingType: "Dark", program: "Cottons" });
  });

  test("insists on both top-level keys", () => {
    expect(() => parseConfig({ chart: [ROW] })).toThrow(/config: machine is missing/);
    expect(() => parseConfig({ machine: MACHINE })).toThrow(/config: chart is missing/);
    expect(() => parseConfig("not a config at all")).toThrow(
      /config: the file must contain an object/,
    );
  });

  test("rejects a chart that isn't an array", () => {
    expect(() => parseConfig(config({ chart: { not: "an array" } }))).toThrow(
      /config: chart must be an array of rows/,
    );
  });

  test("ignores a $schema key alongside machine and chart", () => {
    const parsed = parseConfig({ $schema: "https://example.com/whatever.json", ...config() });
    expect(parsed.machine.washer.name).toBe("Test Washer");
  });

  test("validates the chart against the embedded machine, not some other one", () => {
    expect(() => parseConfig(config({ chart: [{ ...ROW, program: "Turbo Wash" }] }))).toThrow(
      /column "program"/,
    );
  });

  test("still surfaces a bad machine's own error", () => {
    const badMachine = { ...MACHINE, washer: { ...MACHINE.washer, programs: [] } };
    expect(() => parseConfig(config({ machine: badMachine }))).toThrow(/machine: washer.programs/);
  });
});

describe("the JSON config format", () => {
  test("round-trips without losing or changing anything", () => {
    const original = parseConfig(config());
    const roundTripped = configFromJson(configToJson(original));
    expect(roundTripped).toEqual(original);
  });

  test("leads with a $schema key an editor can pick up", () => {
    const original = parseConfig(config());
    const written = JSON.parse(configToJson(original));
    expect(Object.keys(written)[0]).toBe("$schema");
    expect(written.$schema).toBe(
      "https://cdn.jsdelivr.net/npm/@washy-washy/core/schema/config.schema.json",
    );
  });

  test("rejects invalid JSON", () => {
    expect(() => configFromJson("not json")).toThrow(/config: not valid JSON/);
  });

  test("rejects valid JSON that isn't a config object", () => {
    expect(() => configFromJson("[]")).toThrow(/config: machine is missing/);
    expect(() => configFromJson("42")).toThrow(/config: the file must contain an object/);
  });
});
