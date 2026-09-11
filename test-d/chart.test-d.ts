import { expectType } from "tsd";
import { chartFromJson, chartToJson, type Instruction, type Machine } from "../src/index";

declare const instructions: Instruction[];
declare const machine: Machine;

const json = chartToJson(instructions);
expectType<string>(json);

declare const jsonFromStorage: string;
const roundTripped = chartFromJson(jsonFromStorage, machine);
expectType<Instruction[]>(roundTripped);
