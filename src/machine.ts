/**
 * The appliances a chart is drawn for, as data rather than code.
 *
 * Everything the PDFs render — dial angles, which chips exist, what a valid CSV
 * value is — comes from a machine file, so pointing this at a different washing
 * machine is editing JSON rather than editing TypeScript. The labels in that
 * file are copied off the fascia in whatever language it is printed in, and
 * nothing here ever translates them: a chart that says "Cottons" when the dial
 * says "Katoen" is worse than no chart, because you have to translate it back
 * while standing in front of the machine.
 */

export interface Washer {
  /** @maxLength 60 */
  name: string;
  /** @maxLength 30 */
  capacity: string;
  /** Dial labels in physical order from twelve o'clock, clockwise. Index is the angle. */
  programs: string[];
  temperatures: string[];
  spins: string[];
  options: string[];
}

export interface IronSetting {
  /** @maxLength 30 */
  key: string;
  /** @maxLength 5 */
  dots: string;
  /** @maxLength 20 */
  label: string;
  /** @maxLength 60 */
  detail: string;
  steam: boolean;
}

export interface Iron {
  /** @maxLength 60 */
  name: string;
  /** Thermostat positions in order, coolest first. */
  settings: IronSetting[];
}

export interface Machine {
  washer: Washer;
  iron: Iron;
}

function fail(what: string): never {
  throw new Error(`machine: ${what}`);
}

function stringList(value: unknown, field: string, minimum: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry === "")) {
    fail(`${field} must be a list of non-empty strings`);
  }
  const list = value as string[];
  if (list.length < minimum)
    fail(`${field} needs at least ${minimum} entries, found ${list.length}`);
  if (new Set(list).size !== list.length) fail(`${field} repeats a value`);
  const overlong = list.find((entry) => entry.length > maxLength);
  if (overlong !== undefined) {
    fail(`${field} entries must be at most ${maxLength} characters, found "${overlong}"`);
  }
  return list;
}

function text(value: unknown, field: string, maxLength: number, fallback?: string): string {
  const resolved =
    typeof value === "string" && value !== ""
      ? value
      : fallback !== undefined
        ? fallback
        : fail(`${field} must be a non-empty string`);
  if (resolved.length > maxLength) {
    fail(`${field} must be at most ${maxLength} characters, found ${resolved.length}`);
  }
  return resolved;
}

/** How many dots a thermostat position's dial label draws — never more than a handful. */
const MAX_DOTS_LENGTH = 5;

// Per-entry caps for the washer's four dial lists, from @washy-washy/pdf's
// actual fixed-width slots (dial captions, the reference sheet's columns) —
// long enough for anything a real fascia prints, short enough that a card or
// sheet never has to guess how to fit one. Consumers wiring up client-side
// validation (a form's maxLength, say) should import these rather than
// hardcoding the numbers a second time.

/** Longest a single washer.programs dial caption can be. */
export const MAX_WASHER_PROGRAM_LENGTH = 32;

/**
 * Longest a single washer.temperatures entry can be — the reference sheet's
 * °C column. Raised from 12 once washy-washy-pdf#61 made room (see #36).
 */
export const MAX_WASHER_TEMPERATURE_LENGTH = 15;

/** Longest a single washer.spins entry can be. */
export const MAX_WASHER_SPIN_LENGTH = 10;

/** Longest a single washer.options chip can be. */
export const MAX_WASHER_OPTION_LENGTH = 20;

function parseIronSetting(value: unknown, index: number): IronSetting {
  if (typeof value !== "object" || value === null)
    fail(`iron.settings[${index}] must be an object`);
  const raw = value as Record<string, unknown>;
  const key = text(raw.key, `iron.settings[${index}].key`, 30);
  const dots = typeof raw.dots === "string" ? raw.dots : "";
  if (dots.length > MAX_DOTS_LENGTH) {
    fail(`iron.settings[${index}].dots must be at most ${MAX_DOTS_LENGTH} characters`);
  }
  return {
    key,
    dots,
    label: text(raw.label, `iron.settings[${index}].label`, 20),
    detail: text(raw.detail, `iron.settings[${index}].detail`, 60, ""),
    steam: raw.steam === true,
  };
}

/**
 * Checks a parsed machine file and hands back something the renderer can use.
 * Every failure names the field, because the fix is always an edit to that
 * line of JSON.
 *
 * @example
 * ```ts
 * const machine = parseMachine(JSON.parse(machineFileContents));
 * machine.washer.programs; // ["Off", "Cottons", "Wool", ...]
 * ```
 */
export function parseMachine(value: unknown): Machine {
  if (typeof value !== "object" || value === null) fail("the file must contain an object");
  const raw = value as Record<string, unknown>;

  if (typeof raw.washer !== "object" || raw.washer === null) fail("washer is missing");
  if (typeof raw.iron !== "object" || raw.iron === null) fail("iron is missing");

  const washerRaw = raw.washer as Record<string, unknown>;
  const ironRaw = raw.iron as Record<string, unknown>;

  const settings = Array.isArray(ironRaw.settings)
    ? ironRaw.settings
    : fail("iron.settings is missing");
  if (settings.length < 2) fail("iron.settings needs at least 2 positions to draw a ring");

  const keys = settings.map((setting, index) => parseIronSetting(setting, index));
  if (new Set(keys.map((setting) => setting.key)).size !== keys.length) {
    fail("iron.settings repeats a key");
  }

  return {
    washer: {
      name: text(washerRaw.name, "washer.name", 60),
      capacity: text(washerRaw.capacity, "washer.capacity", 30, ""),
      programs: stringList(washerRaw.programs, "washer.programs", 2, MAX_WASHER_PROGRAM_LENGTH),
      temperatures: stringList(
        washerRaw.temperatures,
        "washer.temperatures",
        1,
        MAX_WASHER_TEMPERATURE_LENGTH,
      ),
      spins: stringList(washerRaw.spins, "washer.spins", 1, MAX_WASHER_SPIN_LENGTH),
      options: stringList(washerRaw.options ?? [], "washer.options", 0, MAX_WASHER_OPTION_LENGTH),
    },
    iron: {
      name: text(ironRaw.name, "iron.name", 60),
      settings: keys,
    },
  };
}

/**
 * @example
 * ```ts
 * ironSetting(machine, "2")?.label; // "••"
 * ironSetting(machine, "nope"); // undefined
 * ```
 */
export function ironSetting(machine: Machine, key: string): IronSetting | undefined {
  return machine.iron.settings.find((setting) => setting.key === key);
}

/**
 * The keys a row may write in `iron_setting`, coolest first.
 *
 * There is no key for "do not iron". That is the `ironing` column's job, and
 * two places to say the same thing is two places to disagree.
 *
 * @example
 * ```ts
 * ironSettingKeys(machine); // ["min", "1", "2", "3"]
 * ```
 */
export function ironSettingKeys(machine: Machine): string[] {
  return machine.iron.settings.map((setting) => setting.key);
}

/**
 * `40` becomes `40°`; `cold` stays `cold`. The machine file is free to use
 * whatever word its display shows for the cold wash, so the degree sign is
 * decided by whether the value is a number rather than by a list of exceptions.
 *
 * @example
 * ```ts
 * formatTemperature("40"); // "40°"
 * formatTemperature("cold"); // "cold"
 * ```
 */
export function formatTemperature(value: string): string {
  return /^\d+$/.test(value) ? `${value}°` : value;
}
