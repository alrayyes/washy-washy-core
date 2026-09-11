import { expectType } from "tsd";
import { type Config, parseConfig } from "../src/index";

declare const configFileContents: string;

const config = parseConfig(JSON.parse(configFileContents));
expectType<Config>(config);
expectType<string>(config.machine.washer.name); // "Generic front loader"
// biome-ignore lint/style/noNonNullAssertion: `?.` would assert `string | undefined`, not the `string` the doc's @example shows.
expectType<string>(config.chart[0]!.clothingType); // "Dark"
