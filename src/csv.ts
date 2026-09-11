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
    // Stryker disable next-line BooleanLiteral: equivalent given `trim`
    // above. `trim` strips leading/trailing whitespace per RFC, and the
    // BOM character (U+FEFF) is itself in ECMA-262's WhiteSpace set, so
    // `trim: true` already removes a leading BOM from a string input —
    // confirmed empirically (csv-parse@7.0.2, Node) that `bom: true` vs
    // `false` produce byte-identical output whenever `trim: true` is set.
    // Kept for the case a caller feeds this a Buffer instead of a string,
    // where csv-parse's own decoding runs before `trim` ever sees the data.
    bom: true,
  });
  if (records.length === 0) throw new Error("the CSV has a header but no rows");
  return instructionsFromRows(records, machine);
}
