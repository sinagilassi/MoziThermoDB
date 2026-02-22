// import libs
import {
    Component,
    ComponentKey,
    set_component_id
} from 'mozithermodb-settings';
// ! LOCALS
import { MoziEquation } from "@/core";
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq,
    ArgMap,
    RetMap,
    Awaitable,
    ThermoRecord
} from '@/types';

// NOTE: Type for the map returned by `configureEquation`, keyed by component ID
export type Equation = {
    equation: MoziEquation;
    symbol: string;
    unit: string;
};

// NOTE: Create, configure, and launch an equation in one step
export interface LaunchEquation {
    symbol: string;
    equation: MoziEquation;
    result: RetMap;
}

export interface LaunchEquationAsync {
    symbol: string;
    equation: MoziEquation;
    result: Awaitable<RetMap>;
}

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
 *   return { value: Z, unit: "-", symbol: "Z" };
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
export const createEq = function (
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    name?: string,
    description?: string,
): MoziEquation {
    // NOTE: create equation symbol from return symbol (assumes single return value)
    const retSymbols = Object.values(configRet).map(ret => ret.symbol);
    if (retSymbols.length !== 1) {
        throw new Error('Multiple return values found. Please provide a single return value for createEq.');
    }
    const equationSymbol = retSymbols[0];

    // NOTE: create and return the equation instance
    return new MoziEquation(
        equationSymbol,
        configParams,
        configArgs,
        configRet,
        equation,
        name,
        description
    );
}

/**
 * Configure an equation instance with component-specific parameter data and
 * return a map keyed by the resolved component id.
 *
 * Purpose
 * - Attach the equation to a component id (for logging and lookup)
 * - Initialize the equation with parameter values (via `equation.configure`)
 *
 * Notes
 * - `data` must include all parameters required by `equation.configParameters`
 * - `componentKey` controls the component id format (default: `"Name-Formula"`)
 *
 * Returns
 * - An object shaped as `{ [component_id]: MoziEquation }`
 *
 * Example
 * ```ts
 * const configured = configureEquation(component, equation, [
 *   { name: "A", value: 33298, unit: "J/kmol*K" },
 *   { name: "B", value: 79933, unit: "J/kmol*K" },
 *   { name: "C", value: 2086.9, unit: "K" },
 *   { name: "D", value: 41602, unit: "J/kmol*K" },
 *   { name: "E", value: 991.96, unit: "K" }
 * ]);
 * // configured["Methane-Formula"] -> MoziEquation
 * ```
 */
export const buildEquation = function (
    equation: MoziEquation,
    data: ThermoRecord[],
): Equation {
    // NOTE: configure the equation with the provided data
    equation.configure(data);

    // NOTE: equation symbol
    const equationSymbol = equation.equationSymbol;

    // NOTE: return the configured equation (keyed by symbol for lookup)
    return {
        equation: equation,
        symbol: equationSymbol,
        unit: equation.returnUnit
    };
}

/**
 * Create, configure, and immediately evaluate an equation.
 *
 * Purpose
 * - One-shot helper when you don't need to keep the equation instance
 * - Useful for quick calculations in scripts or tests
 *
 * Notes
 * - `data` must include all parameters required by `configParams`
 * - `args` must include all arguments required by `configArgs`
 *
 * Returns
 * - The evaluated result as a single `Ret`
 *
 * Example
 * ```ts
 * const result = launchEquation(
 *   "Ideal Gas Z",
 *   "Computes compressibility factor Z",
 *   params,
 *   args,
 *   ret,
 *   eq,
 *   [
 *     { name: "Temperature", symbol: "T", value: 298.15, unit: "K" },
 *     { name: "Pressure", symbol: "P", value: 101325, unit: "Pa" }
 *   ],
 *   {
 *     n: { value: 1, unit: "mol", symbol: "n" },
 *     V: { value: 0.024465, unit: "m^3", symbol: "V" }
 *   }
 * );
 * ```
 */
export const launchEq = function (
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: ThermoRecord[],
    args: ArgMap,
    name?: string,
    description?: string,
): LaunchEquation {
    // NOTE: create the equation instance
    const eq: MoziEquation = createEq(
        configParams,
        configArgs,
        configRet,
        equation,
        name,
        description
    );

    // NOTE: configure the equation with the provided data
    eq.configure(data);

    // NOTE: directly evaluate the equation with the provided arguments
    const result = eq.calc(args);

    // NOTE: return the result
    return {
        equation: eq,
        symbol: eq.equationSymbol,
        result
    }
}

/**
 * Create, configure, and immediately evaluate an equation (async).
 *
 * Purpose
 * - One-shot helper for equations that return a Promise
 * - Useful when the equation needs async work (e.g., remote data)
 *
 * Notes
 * - `data` must include all parameters required by `configParams`
 * - `args` must include all arguments required by `configArgs`
 *
 * Returns
 * - An object with the equation instance and the evaluated result
 *
 * Example
 * ```ts
 * const { result } = await launchEqAsync(
 *   "Ideal Gas Z",
 *   "Computes compressibility factor Z",
 *   params,
 *   args,
 *   ret,
 *   asyncEq,
 *   [
 *     { name: "Temperature", symbol: "T", value: 298.15, unit: "K" },
 *     { name: "Pressure", symbol: "P", value: 101325, unit: "Pa" }
 *   ],
 *   {
 *     n: { value: 1, unit: "mol", symbol: "n" },
 *     V: { value: 0.024465, unit: "m^3", symbol: "V" }
 *   }
 * );
 * ```
 */
export const launchEqAsync = function (
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: ThermoRecord[],
    args: ArgMap,
    name?: string,
    description?: string,
): Promise<LaunchEquationAsync> {
    return (async () => {
        // NOTE: create the equation instance
        const eq: MoziEquation = createEq(
            configParams,
            configArgs,
            configRet,
            equation,
            name,
            description
        );

        // NOTE: configure the equation with the provided data
        eq.configure(data);

        // NOTE: directly evaluate the equation with the provided arguments
        const result = await eq.calcAsync(args);

        // NOTE: return the result
        return {
            equation: eq,
            symbol: eq.equationSymbol,
            result
        }
    })();
}
