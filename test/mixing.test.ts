import { describe, expect, test } from "bun:test";
import {
  canMix,
  cardGroups,
  type Instruction,
  ironGroups,
  loadGroups,
  mixBlocker,
  resolve,
  washGroups,
} from "../src/index";

function pile(overrides: Partial<Instruction> = {}): Instruction {
  return {
    clothingType: "Test",
    detergent: "",
    fabricSoftener: false,
    temperature: "40",
    spin: "1200",
    duration: "",
    program: "Katoen",
    options: ["Eco Perfect"],
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

describe("mixBlocker", () => {
  test("lets two identical piles share a drum", () => {
    expect(mixBlocker(pile({ clothingType: "A" }), pile({ clothingType: "B" }))).toBeNull();
  });

  test("keeps whites away from colours", () => {
    expect(mixBlocker(pile({ colourGroup: "white" }), pile({ colourGroup: "colour" }))).toBe(
      "colour",
    );
  });

  test("separates piles whose machine settings differ", () => {
    expect(mixBlocker(pile(), pile({ temperature: "60" }))).toBe("settings");
    expect(mixBlocker(pile(), pile({ spin: "1400" }))).toBe("settings");
    expect(mixBlocker(pile(), pile({ program: "Wol" }))).toBe("settings");
    expect(mixBlocker(pile(), pile({ options: [] }))).toBe("settings");
  });

  test("ignores the order options are listed in", () => {
    const a = pile({ options: ["Eco Perfect", "Extra spoelen"] });
    const b = pile({ options: ["Extra spoelen", "Eco Perfect"] });
    expect(canMix(a, b)).toBe(true);
  });

  test("keeps a lint shedder away from anything that is not one", () => {
    const towels = pile({ mixTags: ["lint-shedder"] });
    expect(mixBlocker(towels, pile())).toBe("lint");
    expect(mixBlocker(towels, pile({ mixTags: ["lint-shedder"] }))).toBeNull();
  });

  test("reports solo before any other reason", () => {
    const wool = pile({ mixTags: ["solo"], colourGroup: "any" });
    expect(mixBlocker(wool, pile({ colourGroup: "white", temperature: "90" }))).toBe("solo");
  });

  test("is symmetric", () => {
    const a = pile({ mixTags: ["lint-shedder"], colourGroup: "white" });
    const b = pile({ colourGroup: "dark", temperature: "30" });
    expect(mixBlocker(a, b)).toBe(mixBlocker(b, a));
  });
});

describe("resolve", () => {
  test("never lists a pile as mixing with itself", () => {
    const items = resolve([pile({ clothingType: "A" }), pile({ clothingType: "B" })]);
    expect(items[0]?.mixesWith).toEqual(["B"]);
    expect(items[1]?.mixesWith).toEqual(["A"]);
  });

  test("leaves a solo pile with nothing to mix with", () => {
    const items = resolve([pile({ clothingType: "Wool", mixTags: ["solo"] }), pile()]);
    expect(items[0]?.mixesWith).toEqual([]);
  });
});

describe("cardGroups", () => {
  test("merges piles that differ only in name", () => {
    const groups = cardGroups([
      pile({ clothingType: "AIRism" }),
      pile({ clothingType: "HEATTECH" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.map((item) => item.clothingType)).toEqual(["AIRism", "HEATTECH"]);
  });

  test("splits on anything you physically set", () => {
    const settings: Partial<Instruction>[] = [
      { program: "Wol" },
      { temperature: "60" },
      { spin: "400" },
      { options: [] },
      { fabricSoftener: true },
      { ironing: true, ironSetting: "3" },
    ];
    for (const setting of settings) {
      const groups = cardGroups([
        pile({ clothingType: "A" }),
        pile({ clothingType: "B", ...setting }),
      ]);
      expect(groups, `differing on ${Object.keys(setting)[0]}`).toHaveLength(2);
    }
  });

  test("still merges when only the prose differs", () => {
    const prose: Partial<Instruction>[] = [
      { detergent: "Something else" },
      { duration: "~9:99" },
      { ironingNotes: "Carefully" },
      { drying: "On a line" },
      { notes: "Beware" },
    ];
    for (const difference of prose) {
      const groups = cardGroups([
        pile({ clothingType: "A" }),
        pile({ clothingType: "B", ...difference }),
      ]);
      expect(groups, `differing on ${Object.keys(difference)[0]}`).toHaveLength(1);
    }
  });

  test("ignores the order options and tags are listed in", () => {
    const groups = cardGroups([
      pile({ clothingType: "A", options: ["Eco Perfect", "Extra spoelen"] }),
      pile({ clothingType: "B", options: ["Extra spoelen", "Eco Perfect"] }),
    ]);
    expect(groups).toHaveLength(1);
  });

  test("keeps every pile exactly once", () => {
    const items = [
      pile({ clothingType: "A" }),
      pile({ clothingType: "B" }),
      pile({ clothingType: "C", temperature: "60" }),
    ];
    expect(cardGroups(items).flat()).toHaveLength(items.length);
  });
});

describe("washGroups", () => {
  test("merges piles the iron would have split", () => {
    const groups = washGroups([
      pile({ clothingType: "Dark", ironing: true, ironSetting: "2" }),
      pile({ clothingType: "Black Socks", ironing: false, ironSetting: "" }),
      pile({ clothingType: "Denim", ironing: true, ironSetting: "3" }),
    ]);
    expect(groups).toHaveLength(1);
  });

  test("still splits on anything you set on the machine", () => {
    const groups = washGroups([
      pile({ clothingType: "A" }),
      pile({ clothingType: "B", fabricSoftener: true }),
    ]);
    expect(groups).toHaveLength(2);
  });
});

describe("ironGroups", () => {
  // What `ironSettingKeys` hands over: real positions only, no sentinel.
  const order = ["min", "1", "2", "3"];

  test("gathers the piles that go at one thermostat position", () => {
    const groups = ironGroups(
      [
        pile({ clothingType: "Socks", ironing: false, ironSetting: "" }),
        pile({
          clothingType: "Merino",
          ironing: true,
          ironSetting: "2",
          temperature: "30",
        }),
        pile({
          clothingType: "Cashmere",
          ironing: true,
          ironSetting: "2",
          program: "Wol",
        }),
      ],
      order,
    );
    expect(groups.map((group) => group.map((item) => item.clothingType))).toEqual([
      ["Merino", "Cashmere"],
      ["Socks"],
    ]);
  });

  test("runs coolest first and leaves do-not-iron until last", () => {
    const groups = ironGroups(
      [
        pile({ clothingType: "Never", ironing: false, ironSetting: "" }),
        pile({ clothingType: "Hot", ironing: true, ironSetting: "3" }),
        pile({ clothingType: "Cool", ironing: true, ironSetting: "1" }),
      ],
      order,
    );
    expect(groups.map((group) => (group[0] as Instruction).ironSetting)).toEqual(["1", "3", ""]);
  });

  test("keeps every pile exactly once", () => {
    const items = [
      pile({ clothingType: "A", ironing: true, ironSetting: "1" }),
      pile({ clothingType: "B", ironing: false, ironSetting: "" }),
      pile({ clothingType: "C", ironing: true, ironSetting: "1" }),
    ];
    expect(ironGroups(items, order).flat()).toHaveLength(items.length);
  });
});

describe("loadGroups", () => {
  test("only groups piles that are all compatible with each other", () => {
    const groups = loadGroups([
      pile({ clothingType: "A" }),
      pile({ clothingType: "B" }),
      pile({ clothingType: "C", temperature: "60", colourGroup: "white" }),
    ]);
    expect(groups.map((group) => group.map((item) => item.clothingType))).toEqual([
      ["A", "B"],
      ["C"],
    ]);
  });
});
