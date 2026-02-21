// import libs
import { MoziEquation } from "@/core";
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq
} from '@/types';


/**
 * Create a typed equation definition that can be initialized with parameters
 * and later evaluated with arguments.
 *
 * Purpose
 * - Define a function with explicit params, args, and return shapes
 * - Initialize it once with parameter values
 * - Evaluate it later by calling `calc(args)`
 *
 * How to use (minimal example)
 * ```ts
 * import { createEquation } from "@/docs/equation";
 * import type { Eq, ConfigParamMap, ConfigArgMap, ConfigRetMap } from "@/types";
 *
 * // 1) Define parameter, argument, and return metadata
 * const params: ConfigParamMap<"T" | "P"> = {
 *   T: { name: "Temperature", symbol: "T", unit: "K", scale: 1 },
 *   P: { name: "Pressure", symbol: "P", unit: "Pa" }
 * };
 *
 * const args: ConfigArgMap<"n" | "V"> = {
 *   n: { name: "Amount", symbol: "n", unit: "mol" },
 *   V: { name: "Volume", symbol: "V", unit: "m^3" }
 * };
 *
 * const ret: ConfigRetMap<"Z"> = {
 *   Z: { name: "Compressibility", symbol: "Z", unit: "-" }
 * };
 *
 * // 2) Implement the equation function
 * const eq: Eq<"T" | "P", "n" | "V", "Z"> = (params, args) => {
 *   const R = 8.314; // J/(mol*K)
 *   const Z = (params.P.value * args.V.value) / (args.n.value * R * params.T.value);
 *   return { Z: { value: Z, unit: "-", symbol: "Z" } };
 * };
 *
 * // 3) Create the equation object
 * const equation = createEquation(
 *   "Ideal Gas Z",
 *   "Computes compressibility factor Z",
 *   params,
 *   args,
 *   ret,
 *   eq
 * );
 *
 * // 4) Initialize with parameter values (once)
 * const instance = equation.retrieve([
 *   { name: "Temperature", value: 298.15, unit: "K" },
 *   { name: "Pressure", value: 101325, unit: "Pa" }
 * ]);
 *
 * // 5) Evaluate later with arguments
 * const result = instance.calc({
 *   n: { value: 1, unit: "mol", symbol: "n" },
 *   V: { value: 0.024465, unit: "m^3", symbol: "V" }
 * });
 * ```
 */
export const createEquation = function (
    name: string,
    description: string,
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq
): MoziEquation {
    return new MoziEquation(
        name,
        description,
        configParams,
        configArgs,
        configRet,
        equation
    );
}
