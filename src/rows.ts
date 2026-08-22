import { ironSettingKeys, type Machine } from "./machine";
import type { ColourGroup, Instruction, MixTag } from "./types";
import { colourGroups, mixTags } from "./types";

export const COLUMNS = [
  "clothing_type",
  "detergent",
  "fabric_softener",
  "temperature",
  "spin",
  "duration",
  "program",
  "options",
  "ironing",
  "ironing_notes",
  "iron_setting",
  "drying",
  "colour_group",
  "mix_tags",
  "notes",
] as const;

/** One row, keyed the same way as a CSV column and the chart's JSON Schema. */
export type Row = Record<(typeof COLUMNS)[number], string>;

export class RowError extends Error {
  constructor(row: number, column: string, message: string) {
    super(`row ${row}, column "${column}": ${message}`);
    this.name = "RowError";
  }
}

/** `a|b|c` -> `["a", "b", "c"]`, tolerating stray whitespace and empties. */
function splitList(value: string): string[] {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function oneOf<T extends string>(
  row: number,
  column: string,
  value: string,
  allowed: readonly T[],
): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new RowError(row, column, `"${value}" is not one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function boolean(row: number, column: string, value: string): boolean {
  const normalised = value.trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(normalised)) return true;
  if (["no", "n", "false", "0"].includes(normalised)) return false;
  throw new RowError(row, column, `"${value}" is not a yes/no value`);
}

/**
 * Checks rows shaped like the chart's schema — the same shape a CSV parses
 * into, or a JSON file round-tripped through `rowsFromInstructions` — against
 * what the appliances in the machine file can actually be set to. A typo in a
 * programme name fails here rather than producing a PDF that tells you to turn
 * the dial to a position that does not exist — and so does a chart written for
 * a different machine than the one you passed.
 *
 * @example
 * ```ts
 * const instructions = instructionsFromRows(JSON.parse(jsonFromStorage), machine);
 * ```
 */
export function instructionsFromRows(
  rows: Record<string, string>[],
  machine: Machine,
): Instruction[] {
  const { washer } = machine;

  if (rows.length === 0) throw new Error("the chart has no rows");

  const header = Object.keys(rows[0] as Record<string, string>);
  const missing = COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw new Error(`the chart is missing column(s): ${missing.join(", ")}`);
  }

  return rows.map((record, index) => {
    // +2: one for the header row, one because humans count from 1. Kept even
    // for a JSON source, so an error message reads the same regardless of
    // which format the chart came from.
    const row = index + 2;

    const clothingType = (record.clothing_type ?? "").trim();
    if (clothingType === "") throw new RowError(row, "clothing_type", "must not be empty");

    const options = splitList(record.options ?? "").map((option) =>
      oneOf(row, "options", option, washer.options),
    );

    const tags = splitList(record.mix_tags ?? "").map((tag) =>
      oneOf<MixTag>(row, "mix_tags", tag, mixTags),
    );

    // `ironing` decides whether there is a thermostat position at all, so the
    // two are checked together: a pile you never iron has nowhere to point the
    // dial, and a pile you do iron has to say where.
    const ironing = boolean(row, "ironing", record.ironing ?? "");
    const rawSetting = (record.iron_setting ?? "").trim();
    if (!ironing && rawSetting !== "") {
      throw new RowError(
        row,
        "iron_setting",
        `must be empty when ironing is no, found "${rawSetting}"`,
      );
    }
    const ironSetting = ironing
      ? oneOf(row, "iron_setting", rawSetting, ironSettingKeys(machine))
      : "";

    return {
      clothingType,
      detergent: record.detergent ?? "",
      fabricSoftener: boolean(row, "fabric_softener", record.fabric_softener ?? ""),
      temperature: oneOf(row, "temperature", record.temperature ?? "", washer.temperatures),
      spin: oneOf(row, "spin", record.spin ?? "", washer.spins),
      duration: record.duration ?? "",
      program: oneOf(row, "program", record.program ?? "", washer.programs),
      options,
      ironing,
      ironingNotes: record.ironing_notes ?? "",
      ironSetting,
      drying: record.drying ?? "",
      colourGroup: oneOf<ColourGroup>(row, "colour_group", record.colour_group ?? "", colourGroups),
      mixTags: tags,
      notes: record.notes ?? "",
    };
  });
}

/**
 * The reverse of `instructionsFromRows` — what a JSON export writes out.
 *
 * @example
 * ```ts
 * const rows = rowsFromInstructions(instructions);
 * ```
 */
export function rowsFromInstructions(instructions: Instruction[]): Row[] {
  return instructions.map((instruction) => ({
    clothing_type: instruction.clothingType,
    detergent: instruction.detergent,
    fabric_softener: instruction.fabricSoftener ? "yes" : "no",
    temperature: instruction.temperature,
    spin: instruction.spin,
    duration: instruction.duration,
    program: instruction.program,
    options: instruction.options.join("|"),
    ironing: instruction.ironing ? "yes" : "no",
    ironing_notes: instruction.ironingNotes,
    iron_setting: instruction.ironSetting,
    drying: instruction.drying,
    colour_group: instruction.colourGroup,
    mix_tags: instruction.mixTags.join("|"),
    notes: instruction.notes,
  }));
}

/**
 * The JSON interchange format for a chart — the same row shape
 * a chart's JSON Schema describes, so a file written here validates against
 * it exactly as a CSV does.
 *
 * @example
 * ```ts
 * const json = chartToJson(instructions);
 * ```
 */
export function chartToJson(instructions: Instruction[]): string {
  return `${JSON.stringify(rowsFromInstructions(instructions), null, 2)}\n`;
}

/**
 * The other half of `chartToJson`. Throws the same errors `parseInstructions` does.
 *
 * @example
 * ```ts
 * const instructions = chartFromJson(jsonFromStorage, machine);
 * ```
 */
export function chartFromJson(source: string, machine: Machine): Instruction[] {
  let rows: unknown;
  try {
    rows = JSON.parse(source);
  } catch (error) {
    throw new Error(`not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (!Array.isArray(rows)) throw new Error("the chart must be a JSON array of rows");
  return instructionsFromRows(rows as Record<string, string>[], machine);
}
