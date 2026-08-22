import type { Instruction, ResolvedInstruction } from "./types";

/** Why two piles cannot share a drum. `null` means they can. */
export type Blocker = "solo" | "settings" | "colour" | "lint";

export const blockerLegend: Record<Blocker, string> = {
  solo: "Wash on its own",
  settings: "Different programme, temperature, spin or options",
  colour: "Colours would run into each other",
  lint: "One sheds lint onto the other",
};

/** Short codes used in the compatibility matrix, so a cell stays one glyph. */
export const blockerCode: Record<Blocker, string> = {
  solo: "S",
  settings: "P",
  colour: "C",
  lint: "L",
};

function sameSettings(a: Instruction, b: Instruction): boolean {
  return (
    a.program === b.program &&
    a.temperature === b.temperature &&
    a.spin === b.spin &&
    a.options.length === b.options.length &&
    a.options.every((option) => b.options.includes(option))
  );
}

function compatibleColours(a: Instruction, b: Instruction): boolean {
  if (a.colourGroup === "any" || b.colourGroup === "any") return true;
  return a.colourGroup === b.colourGroup;
}

/**
 * Decides whether two piles can go in the drum together, and if not, why.
 *
 * The order matters: the reason reported is the one you would want to hear
 * first. "Wash it alone" beats "the spin speed differs", because changing the
 * spin speed would not help.
 *
 * @example
 * ```ts
 * mixBlocker(towels, socks); // "lint" — towels shed onto everything else
 * mixBlocker(socks, socks2); // null — nothing stops them sharing a drum
 * ```
 */
export function mixBlocker(a: Instruction, b: Instruction): Blocker | null {
  if (a.mixTags.includes("solo") || b.mixTags.includes("solo")) return "solo";

  // Terry sheds lint over everything, so towels only ever go with towels.
  const shedders = [a, b].filter((item) => item.mixTags.includes("lint-shedder"));
  if (shedders.length === 1) return "lint";

  if (!compatibleColours(a, b)) return "colour";
  if (!sameSettings(a, b)) return "settings";
  return null;
}

/**
 * @example
 * ```ts
 * canMix(towels, socks); // false
 * ```
 */
export function canMix(a: Instruction, b: Instruction): boolean {
  return mixBlocker(a, b) === null;
}

/**
 * Annotates each instruction with the other piles it may share a load with.
 *
 * @example
 * ```ts
 * resolve(instructions)[0].mixesWith; // ["Socks", "Jeans"]
 * ```
 */
export function resolve(instructions: Instruction[]): ResolvedInstruction[] {
  return instructions.map((instruction) => ({
    ...instruction,
    mixesWith: instructions
      .filter((other) => other !== instruction && canMix(instruction, other))
      .map((other) => other.clothingType),
  }));
}

/**
 * Groups piles that can all be washed together — every member compatible with
 * every other, not merely with the first one it met.
 *
 * @example
 * ```ts
 * loadGroups(instructions); // [[towels], [socks, jeans], [wool]]
 * ```
 */
export function loadGroups<T extends Instruction>(instructions: T[]): T[][] {
  const groups: T[][] = [];
  for (const instruction of instructions) {
    const home = groups.find((group) => group.every((member) => canMix(member, instruction)));
    if (home) home.push(instruction);
    else groups.push([instruction]);
  }
  return groups;
}

function groupBy<T>(items: T[], key: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const existing = groups.get(key(item));
    if (existing) existing.push(item);
    else groups.set(key(item), [item]);
  }
  return [...groups.values()];
}

/**
 * Everything you physically set on the washing machine: the programme, what
 * the display reads, which buttons are lit, and whether softener goes in.
 *
 * Deliberately *not* the prose. Two piles can want the same five settings and
 * still want different detergent or a different drying rack, and those the card
 * lists per pile rather than splitting into two near-identical cards.
 */
function washFingerprint(item: Instruction): string {
  return JSON.stringify([
    item.program,
    item.temperature,
    item.spin,
    [...item.options].sort(),
    item.fabricSoftener,
  ]);
}

/**
 * Piles you set the machine and the iron up for identically. Every dial
 * drawing on their cards would be the same drawing, so they get one card
 * listing all the names.
 *
 * @example
 * ```ts
 * cardGroups(instructions).map((group) => group.map((item) => item.clothingType));
 * // [["Socks", "Jeans"], ["Towels"]]
 * ```
 */
export function cardGroups<T extends Instruction>(instructions: T[]): T[][] {
  return groupBy(instructions, (item) =>
    JSON.stringify([washFingerprint(item), item.ironing, item.ironSetting]),
  );
}

/**
 * The same, for a sheet with no iron on it. Dark, Black Socks and Denim each
 * need their own card on the full chart only because they want three different
 * thermostat positions; standing at the machine they are one wash.
 *
 * @example
 * ```ts
 * washGroups(instructions); // merges piles cardGroups would have split on iron settings alone
 * ```
 */
export function washGroups<T extends Instruction>(instructions: T[]): T[][] {
  return groupBy(instructions, washFingerprint);
}

/**
 * Piles by where the iron's thermostat points, coolest first.
 *
 * An ironing sheet is read the other way round from a washing one. You do not
 * fetch a pile and look up its setting — you set the iron once and work through
 * everything that goes at that heat, so the thermostat position is the heading
 * and the piles are the list under it. `order` is `ironSettingKeys`; a pile you
 * never iron has no position in it and sorts last, which is right — it is the
 * pile you never pick up.
 *
 * @example
 * ```ts
 * ironGroups(instructions, ironSettingKeys(machine));
 * ```
 */
export function ironGroups<T extends Instruction>(
  instructions: T[],
  order: readonly string[],
): T[][] {
  const rank = (setting: string) => {
    const at = order.indexOf(setting);
    return at < 0 ? order.length : at;
  };
  return groupBy(instructions, (item) => item.ironSetting).sort(
    (a, b) => rank((a[0] as T).ironSetting) - rank((b[0] as T).ironSetting),
  );
}
