import { expectType } from "tsd";
import { type Instruction, type Machine, parseInstructions } from "../src/index";

declare const csvFileContents: string;
declare const machine: Machine;

const instructions = parseInstructions(csvFileContents, machine);
expectType<Instruction[]>(instructions);
