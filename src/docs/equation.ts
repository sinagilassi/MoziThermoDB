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
    Awaitable
} from '@/types';

// NOTE: Type for the map returned by `configureEquation`, keyed by component ID
export type ComponentMoziEquation = { [key: string]: MoziEquation };

// NOTE: Create, configure, and launch an equation in one step
export interface LaunchEquation {
    equation: MoziEquation;
    result: RetMap;
}

export interface LaunchEquationAsync {
    equation: MoziEquation;
    result: Awaitable<RetMap>;
}

/**
 * SECTION: Create a typed equation definition that can be initialized with parameters
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
export const createEq = function (
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

/**
 * SECTION: Configure an equation instance with component-specific parameter data and
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
export const configureEq = function (
    component: Component,
    equation: MoziEquation,
    data: { name: string; symbol: string; value: number; unit: string }[],
    componentKey: ComponentKey = "Name-Formula"
): ComponentMoziEquation {
    // NOTE: set component ID for logging
    const component_id = set_component_id(component, componentKey);
    console.log(`Configuring equation for component: ${component_id}`);

    // NOTE: configure the equation with the provided data
    equation.configure(data);

    // NOTE: create a map with the component ID as the key and the configured equation as the value
    const res = {
        [component_id]: equation
    }

    // NOTE: return the configured equation instance
    return res;
}

/**
 * SECTION: Create, configure, and immediately evaluate an equation.
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
 * - The evaluated result as a `RetMap`
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
    name: string,
    description: string,
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: { name: string; symbol: string; value: number; unit: string }[],
    args: ArgMap
): LaunchEquation {
    // NOTE: create the equation instance
    const eq: MoziEquation = createEq(
        name,
        description,
        configParams,
        configArgs,
        configRet,
        equation
    );

    // NOTE: configure the equation with the provided data
    eq.configure(data);

    // NOTE: directly evaluate the equation with the provided arguments
    const result = eq.calc(args);

    // NOTE: return the result
    return {
        equation: eq,
        result
    }
}

export const launchEqAsync = function (
    name: string,
    description: string,
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: { name: string; symbol: string; value: number; unit: string }[],
    args: ArgMap
): Promise<LaunchEquationAsync> {
    return (async () => {
        // NOTE: create the equation instance
        const eq: MoziEquation = createEq(
            name,
            description,
            configParams,
            configArgs,
            configRet,
            equation
        );

        // NOTE: configure the equation with the provided data
        eq.configure(data);

        // NOTE: directly evaluate the equation with the provided arguments
        const result = await eq.calcAsync(args);

        // NOTE: return the result
        return {
            equation: eq,
            result
        }
    })();
}