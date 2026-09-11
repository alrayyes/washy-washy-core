import { expectType } from "tsd";
import { type Machine, parseMachine } from "../src/index";

declare const machineFileContents: string;

const machine = parseMachine(JSON.parse(machineFileContents));
expectType<Machine>(machine);
expectType<string[]>(machine.washer.programs); // ["Off", "Cottons", "Wool", ...]
