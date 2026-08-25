/** Which pile a garment belongs to on colour grounds. `any` mixes with all. */
export const colourGroups = ["white", "colour", "dark", "sport", "any"] as const;
export type ColourGroup = (typeof colourGroups)[number];

/**
 * Reasons two piles might not belong together even when the machine settings
 * agree. See `canMix` in `mixing.ts` for how each one is applied.
 */
export const mixTags = ["lint-shedder", "lint-magnet", "dye-bleeder", "solo"] as const;
export type MixTag = (typeof mixTags)[number];

/**
 * One CSV row: everything needed to wash, iron and dry one pile of laundry.
 *
 * The machine-facing fields are plain strings rather than unions, because what
 * counts as valid depends on the machine file you point this at. `csv.ts`
 * checks each of them against that machine as it parses, so nothing downstream
 * has to wonder whether a programme name exists.
 */
export interface Instruction {
  /** @maxLength 60 */
  clothingType: string;
  /** @maxLength 200 */
  detergent: string;
  fabricSoftener: boolean;
  temperature: string;
  spin: string;
  /** @maxLength 12 */
  duration: string;
  program: string;
  options: string[];
  /** Whether this pile gets ironed at all. */
  ironing: boolean;
  /**
   * How to iron it, or why you don't. Free prose and often empty, because most
   * of what there is to say about a pile nobody irons is already said by
   * `ironing` being false.
   * @maxLength 400
   */
  ironingNotes: string;
  /** Thermostat position. Empty when `ironing` is false. */
  ironSetting: string;
  /** @maxLength 150 */
  drying: string;
  colourGroup: ColourGroup;
  mixTags: MixTag[];
  /** @maxLength 500 */
  notes: string;
  /**
   * Who to credit for a care instruction that isn't obvious from the garment
   * itself — "the label says 40°" doesn't need one, "the manufacturer says
   * wash these alone" might. Empty when there's nothing to cite.
   * @maxLength 80
   */
  referenceName: string;
  /**
   * A link backing up `referenceName`. Empty when there's nothing to cite.
   * @maxLength 2048
   */
  referenceLink: string;
}

/** An instruction plus the other piles it may share a drum with. */
export interface ResolvedInstruction extends Instruction {
  mixesWith: string[];
}

/**
 * How long a card or a load is going to tie the machine up.
 *
 * Usually one figure. Piles sharing a load agree on every setting, so they
 * ought to agree on this too — but the chart is data somebody types, and
 * printing both is more honest than picking the first one and hoping.
 *
 * @example
 * ```ts
 * durationsOf([pile, pile]); // "~2:00"
 * durationsOf([pile, { ...pile, duration: "~1:10" }]); // "~2:00 / ~1:10"
 * ```
 */
export function durationsOf(group: Instruction[]): string {
  return [...new Set(group.map((item) => item.duration).filter((value) => value !== ""))].join(
    " / ",
  );
}

/**
 * Which sheet to draw.
 *
 * `full` is the whole chart. The other two are the same chart cut where the
 * work is: washing happens in front of the machine on a Sunday morning, ironing
 * happens at a board on a Wednesday evening, and neither job wants to read past
 * the other's advice to find its own.
 */
export const variants = ["full", "wash", "iron"] as const;
export type Variant = (typeof variants)[number];
