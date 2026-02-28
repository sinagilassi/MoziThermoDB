// import libs
import {
    Component,
    ComponentKey,
    set_component_id
} from 'mozithermodb-settings';
// ! LOCALS
import { MoziEquation } from "@/core";
import {
    assertRawThermoRecordMatchesComponent,
    extractComponentDataFromRawThermoRecord
} from "@/utils";
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq,
    ArgMap,
    RetMap,
    Awaitable,
    RawThermoRecord
} from '@/types';

// NOTE: Type for the map returned by `configureEquation`, keyed by component ID
export type Equation = {
    equation: MoziEquation;
    symbol: string;
    unit: string;
};

// ! key: equation symbol (e.g. "Cp_IG")
// ! value: MoziEquation instance configured with the provided data
export type ComponentEquation = {
    [key: string]: MoziEquation;
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
 * Create a reusable equation definition (template) that can be configured
 * later with component-specific thermo data and evaluated with arguments.
 *
 * Purpose
 * - Define a function with explicit params, args, and return shapes
 * - Reuse the same equation definition across components
 * - Configure cloned instances later with parameter values
 * - Evaluate configured instances by calling `calc(args)`
 *
 * How to use (minimal example)
 * ```ts
 * import { createEq, buildEquation } from "@/docs/equation";
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
 * const eq: Eq<"T" | "P", "n" | "V"> = (params, args) => {
 *   const R = 8.314; // J/(mol*K)
 *   const Z = (params.P.value * args.V.value) / (args.n.value * R * params.T.value);
 *   return { value: Z, unit: "-", symbol: "Z" };
 * };
 *
 * // 3) Create the equation object
 * const equation = createEq(
 *   params,
 *   args,
 *   ret,
 *   eq,
 *   "Ideal Gas Z",
 *   "Computes compressibility factor Z"
 * );
 *
 * // 4) Build a configured instance from raw component data (clone + configure)
 * const instance = buildEquation(equation, [
 *   { name: "Temperature", symbol: "T", value: 298.15, unit: "K" },
 *   { name: "Pressure", symbol: "P", value: 101325, unit: "Pa" }
 * ]).equation;
 *
 * // 5) Evaluate later with arguments
 * const result = instance.calc({
 *   n: { value: 1, unit: "mol", symbol: "n" },
 *   V: { value: 0.024465, unit: "m^3", symbol: "V" }
 * });
 * ```
 *
 * @param configParams Parameter metadata and defaults for the equation.
 * @param configArgs Runtime argument metadata for equation evaluation.
 * @param configRet Return metadata (expects exactly one return symbol).
 * @param equation Equation implementation function.
 * @param name Optional equation name.
 * @param description Optional equation description.
 * @returns A reusable `MoziEquation` template.
 * @throws Error If `configRet` defines multiple return symbols.
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
 * Build an independently configured equation instance from a reusable equation
 * template and raw thermo data.
 *
 * Purpose
 * - Clone the provided `equation` template
 * - Clean raw thermo records and initialize parameter values
 * - Return a configured equation instance without mutating the original template
 *
 * Notes
 * - `data` must include all parameters required by `equation.configParameters`
 * Returns
 * - An object with the configured equation plus symbol/unit metadata
 *
 * Example
 * ```ts
 * const configured = buildEquation(equationTemplate, [
 *   { name: "Name", symbol: "Name", value: "Methane", unit: "" },
 *   { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
 *   { name: "State", symbol: "State", value: "g", unit: "" },
 *   { name: "A Constant", symbol: "A", value: 33298, unit: "J/kmol*K" },
 *   { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
 *   { name: "C Constant", symbol: "C", value: 2086.9, unit: "K" },
 *   { name: "D Constant", symbol: "D", value: 41602, unit: "J/kmol*K" },
 *   { name: "E", symbol: "E", value: 991.96, unit: "K" }
 * ]);
 * // configured.equation -> independently configured MoziEquation instance
 * ```
 *
 * @param equation Reusable equation template to clone and configure.
 * @param data Raw thermo records used to configure the cloned equation.
 * @returns The configured equation plus symbol and unit metadata.
 */
export const buildEquation = function (
    equation: MoziEquation,
    data: RawThermoRecord[],
): Equation {
    const configuredEquation = equation.clone();

    // NOTE: add data to the equation instance
    configuredEquation.addData = data;

    // NOTE: configure the equation with the provided data
    configuredEquation.configure();

    // NOTE: equation symbol
    const equationSymbol = configuredEquation.equationSymbol;

    // NOTE: return the configured equation (keyed by symbol for lookup)
    return {
        equation: configuredEquation,
        symbol: equationSymbol,
        unit: configuredEquation.returnUnit
    };
}

/**
 * Build a component-keyed equation map using a cloned/configured equation instance.
 *
 * Notes
 * - Clones the provided `equation` template once per call
 * - Accepts raw thermo records (`RawThermoRecord[]`) and cleans them via `MoziEquation.addData`
 * - The same configured clone is attached to each generated component id alias
 *   for the same component (e.g. "Name-Formula", "Formula-State", "Name-State")
 * - Does not mutate the original template equation
 * - Optional guard can verify the provided `data` belongs to the provided `component`
 *   by comparing a component id built from raw data rows (e.g. `"Name-Formula"`)
 *
 * Guard args
 * - `enableDataComponentMatchCheck`: enables component/data validation before configure
 * - `dataComponentMatchKey`: key format used for validation (e.g. `"Name-Formula"`)
 *
 * @param component Component whose equation map should be created.
 * @param equation Reusable equation template to clone and configure.
 * @param data Raw thermo records used to configure the cloned equation.
 * @param componentKey Component id alias formats used as result keys.
 * @param enableDataComponentMatchCheck Enables strict component/data validation.
 * @param dataComponentMatchKey Component id key format used for validation.
 * @returns A map keyed by generated component ids, each containing the configured equation by symbol.
 * @throws Error When component/data matching is enabled and the records do not match the component.
 */
export const buildComponentEquation = function (
    component: Component,
    equation: MoziEquation,
    data: RawThermoRecord[],
    componentKey: ComponentKey[] = ["Name-Formula", "Formula-State", "Name-State"],
    enableDataComponentMatchCheck: boolean = false,
    dataComponentMatchKey: ComponentKey = "Name-Formula"
): Record<string, ComponentEquation> {
    const configuredEquation = equation.clone();

    if (enableDataComponentMatchCheck) {
        assertRawThermoRecordMatchesComponent(component, data, dataComponentMatchKey);
    }

    // NOTE: resolve component id
    const componentIds = componentKey.map(key => set_component_id(component, key));

    // NOTE: add data to the equation instance
    configuredEquation.addData = data;
    // NOTE: configure the equation with the provided data
    configuredEquation.configure();

    // NOTE: equation symbol
    const equationSymbol = configuredEquation.equationSymbol;

    // NOTE: return the configured equation (keyed by component id for lookup)
    const componentEquation: Record<string, ComponentEquation> = {};

    // Attach the same configured equation instance to each component id alias for this component
    componentIds.forEach(id => {
        componentEquation[id] = {
            [equationSymbol]: configuredEquation
        };
    });

    // res
    return componentEquation;
}


/**
 * Build and merge configured equation maps for multiple components.
 *
 * For each component, this function extracts matching raw thermo records,
 * configures a cloned equation instance, and stores it under all requested
 * component id aliases.
 *
 * @param components Components to process.
 * @param equation Reusable equation template to clone/configure per component.
 * @param data Raw thermo datasets to search for each component.
 * @param componentKey Component id alias formats used in the result map.
 * @param enableDataComponentMatchCheck Enables strict component/data validation.
 * @param dataComponentMatchKey Component id key format used for matching/validation.
 * @returns A merged map keyed by generated component ids.
 */
export const buildComponentsEquation = function (
    components: Component[],
    equation: MoziEquation,
    data: RawThermoRecord[][],
    componentKey: ComponentKey[] = ["Name-Formula", "Formula-State", "Name-State"],
    enableDataComponentMatchCheck: boolean = false,
    dataComponentMatchKey: ComponentKey = "Name-Formula"
): Record<string, ComponentEquation> {
    // NOTE: build a component equation for each component and merge into a single map
    const componentEquations: Record<string, ComponentEquation> = {};

    // iterate over components and build an equation for each using the provided data
    components.forEach(component => {
        const componentData = extractComponentDataFromRawThermoRecord(component, data, dataComponentMatchKey);

        // ! component equation map for this component
        const componentEq: Record<string, ComponentEquation> = buildComponentEquation(
            component,
            equation,
            componentData.records,
            componentKey,
            enableDataComponentMatchCheck,
            dataComponentMatchKey
        );

        // merge the component equation into the overall map (handles multiple aliases per component)
        Object.assign(componentEquations, componentEq);
    });

    // res
    return componentEquations;
}


/**
 * Create, configure, and immediately evaluate an equation.
 *
 * Purpose
 * - One-shot helper when you don't need to keep a configured instance
 * - Useful for quick calculations in scripts or tests
 *
 * Notes
 * - `data` can include raw/string fields such as `"Name"` / `"Formula"` / `"State"`
 * - Numeric parameter/range fields are cleaned from raw thermo records before configuration
 * - `args` must include all arguments required by `configArgs`
 *
 * Returns
 * - The evaluated result as a single `Ret`
 *
 * Example
 * ```ts
 * const result = launchEq(
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
 *
 * @param configParams Parameter metadata and defaults for the equation.
 * @param configArgs Runtime argument metadata for equation evaluation.
 * @param configRet Return metadata used to create the equation symbol.
 * @param equation Equation implementation function.
 * @param data Raw thermo records used for equation configuration.
 * @param args Runtime input arguments passed to `calc`.
 * @param name Optional equation name.
 * @param description Optional equation description.
 * @returns The created equation, its symbol, and evaluated result.
 * @throws Error If `configRet` defines multiple return symbols.
 */
export const launchEq = function (
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: RawThermoRecord[],
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
    // NOTE: add data to the equation instance
    eq.addData = data;
    // NOTE: configure the equation with the provided data
    eq.configure();

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
 * - `data` can include raw/string fields such as `"Name"` / `"Formula"` / `"State"`
 * - Numeric parameter/range fields are cleaned from raw thermo records before configuration
 * - `args` must include all arguments required by `configArgs`
 *
 * Returns
 * - An object with the equation instance and the evaluated result
 *
 * Example
 * ```ts
 * const { result } = await launchEqAsync(
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
 *   },
 *   "Ideal Gas Z",
 *   "Computes compressibility factor Z"
 * );
 * ```
 *
 * @param configParams Parameter metadata and defaults for the equation.
 * @param configArgs Runtime argument metadata for equation evaluation.
 * @param configRet Return metadata used to create the equation symbol.
 * @param equation Equation implementation function.
 * @param data Raw thermo records used for equation configuration.
 * @param args Runtime input arguments passed to `calcAsync`.
 * @param name Optional equation name.
 * @param description Optional equation description.
 * @returns A promise resolving to the created equation, its symbol, and evaluated result.
 * @throws Error If `configRet` defines multiple return symbols.
 */
export const launchEqAsync = function (
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq,
    data: RawThermoRecord[],
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

        // NOTE: add data to the equation instance
        eq.addData = data;
        // NOTE: configure the equation with the provided data
        eq.configure();

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
