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
  name: string;
  capacity: string;
  /** Dial labels in physical order from twelve o'clock, clockwise. Index is the angle. */
  programs: string[];
  temperatures: string[];
  spins: string[];
  options: string[];
}

export interface IronSetting {
  key: string;
  dots: string;
  label: string;
  detail: string;
  steam: boolean;
}

export interface Iron {
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

function stringList(value: unknown, field: string, minimum: number): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry === "")) {
    fail(`${field} must be a list of non-empty strings`);
  }
  const list = value as string[];
  if (list.length < minimum)
    fail(`${field} needs at least ${minimum} entries, found ${list.length}`);
  if (new Set(list).size !== list.length) fail(`${field} repeats a value`);
  return list;
}

function text(value: unknown, field: string, fallback?: string): string {
  if (typeof value === "string" && value !== "") return value;
  if (fallback !== undefined) return fallback;
  return fail(`${field} must be a non-empty string`);
}

function parseIronSetting(value: unknown, index: number): IronSetting {
  if (typeof value !== "object" || value === null)
    fail(`iron.settings[${index}] must be an object`);
  const raw = value as Record<string, unknown>;
  const key = text(raw.key, `iron.settings[${index}].key`);
  return {
    key,
    dots: typeof raw.dots === "string" ? raw.dots : "",
    label: text(raw.label, `iron.settings[${index}].label`),
    detail: text(raw.detail, `iron.settings[${index}].detail`, ""),
    steam: raw.steam === true,
  };
}

/**
 * Checks a parsed machine file and hands back something the renderer can use.
 * Every failure names the field, because the fix is always an edit to that
 * line of JSON.
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
      name: text(washerRaw.name, "washer.name"),
      capacity: text(washerRaw.capacity, "washer.capacity", ""),
      programs: stringList(washerRaw.programs, "washer.programs", 2),
      temperatures: stringList(washerRaw.temperatures, "washer.temperatures", 1),
      spins: stringList(washerRaw.spins, "washer.spins", 1),
      options: stringList(washerRaw.options ?? [], "washer.options", 0),
    },
    iron: {
      name: text(ironRaw.name, "iron.name"),
      settings: keys,
    },
  };
}

export function ironSetting(machine: Machine, key: string): IronSetting | undefined {
  return machine.iron.settings.find((setting) => setting.key === key);
}

/**
 * The keys a row may write in `iron_setting`, coolest first.
 *
 * There is no key for "do not iron". That is the `ironing` column's job, and
 * two places to say the same thing is two places to disagree.
 */
export function ironSettingKeys(machine: Machine): string[] {
  return machine.iron.settings.map((setting) => setting.key);
}

/**
 * `40` becomes `40°`; `cold` stays `cold`. The machine file is free to use
 * whatever word its display shows for the cold wash, so the degree sign is
 * decided by whether the value is a number rather than by a list of exceptions.
 */
export function formatTemperature(value: string): string {
  return /^\d+$/.test(value) ? `${value}°` : value;
}
