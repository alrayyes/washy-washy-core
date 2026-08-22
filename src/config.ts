import { type Machine, parseMachine } from "./machine";
import { instructionsFromRows, rowsFromInstructions } from "./rows";
import type { Instruction } from "./types";

/**
 * The washing machine and the chart that describes it, in one place. Both
 * halves are exactly what `parseMachine`/`instructionsFromRows` already
 * produce — this is a wrapper around the pair, not a third shape.
 */
export interface Config {
  machine: Machine;
  chart: Instruction[];
}

/**
 * Validates a `{ machine, chart }` object, checking the chart against the
 * machine it's embedded with — never a different one. Every failure names
 * which half is wrong, same as `parseMachine` and `instructionsFromRows` do
 * on their own.
 */
export function parseConfig(value: unknown): Config {
  if (typeof value !== "object" || value === null) {
    throw new Error("config: the file must contain an object");
  }
  const raw = value as Record<string, unknown>;

  if (!("machine" in raw)) throw new Error("config: machine is missing");
  if (!("chart" in raw)) throw new Error("config: chart is missing");

  const machine = parseMachine(raw.machine);

  if (!Array.isArray(raw.chart)) throw new Error("config: chart must be an array of rows");
  const chart = instructionsFromRows(raw.chart as Record<string, string>[], machine);

  return { machine, chart };
}

/** The reverse of `parseConfig` — what a JSON export writes out. */
export function configToJson(config: Config): string {
  const rows = { machine: config.machine, chart: rowsFromInstructions(config.chart) };
  return `${JSON.stringify(rows, null, 2)}\n`;
}

/** The other half of `configToJson`. Throws the same errors `parseConfig` does. */
export function configFromJson(source: string): Config {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`config: not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  return parseConfig(value);
}
