import { parse } from "csv-parse/sync";
import type { Machine } from "./machine";
import { instructionsFromRows } from "./rows";
import type { Instruction } from "./types";

/**
 * Parses the instruction CSV. See `instructionsFromRows` for the row rules.
 *
 * @example
 * ```ts
 * const instructions = parseInstructions(csvFileContents, machine);
 * ```
 */
export function parseInstructions(source: string, machine: Machine): Instruction[] {
  const records: Record<string, string>[] = parse(source, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  if (records.length === 0) throw new Error("the CSV has a header but no rows");
  return instructionsFromRows(records, machine);
}
