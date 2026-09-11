import { expectType } from "tsd";
import { type Blocker, type Instruction, mixBlocker } from "../src/index";

declare const towels: Instruction;
declare const socks: Instruction;
declare const socks2: Instruction;

expectType<Blocker | null>(mixBlocker(towels, socks)); // "lint" — towels shed onto everything else
expectType<Blocker | null>(mixBlocker(socks, socks2)); // null — nothing stops them sharing a drum
