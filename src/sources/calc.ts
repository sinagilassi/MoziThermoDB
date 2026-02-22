// import libs
// ! LOCALS
import type { ComponentEquationSource } from "@/types/sources";
import type { ArgMap } from "@/types";

export type CalcEqResult = {
    value: number;
    unit: string;
};

export const calcEq = function (
    eqSrc: ComponentEquationSource,
    vars: Record<string, number>,
    outputUnit?: string
): CalcEqResult | null {
    try {
        // SECTION: equation expression
        const eqArgs = eqSrc.args;
        const eqReturns = eqSrc.returns;
        const returnsInner = Object.values(eqReturns)[0];
        const eqReturnUnit = returnsInner?.unit;

        // SECTION: merge external vars with existing inputs (prefer vars)
        const mergedVars: Record<string, number> = {};
        for (const [key, input] of Object.entries(eqSrc.inputs)) {
            if (typeof input.value === "number") {
                mergedVars[key] = input.value;
            }
        }
        for (const [key, value] of Object.entries(vars)) {
            mergedVars[key] = value;
        }

        // SECTION: check all vars are provided (from merged inputs or external vars)
        for (const [argKey, argCfg] of Object.entries(eqArgs)) {
            const symbol = argCfg.symbol ?? argKey;
            if (!(argKey in mergedVars) && !(symbol in mergedVars)) {
                throw new Error(`Missing argument '${argKey}' for equation calculation.`);
            }
        }

        // SECTION: build args map for calc
        const argMap: ArgMap = {};
        for (const [argKey, argCfg] of Object.entries(eqArgs)) {
            const symbol = argCfg.symbol ?? argKey;
            const value = (argKey in mergedVars ? mergedVars[argKey] : mergedVars[symbol]) as number;
            argMap[argKey] = {
                value,
                unit: argCfg.unit,
                symbol
            };
        }

        // SECTION: calculate equation
        const res = eqSrc.source.calc(argMap);

        const value = res.value;
        let unit = res.unit;

        if (value === undefined || unit === undefined) {
            return null;
        }

        if (typeof value !== "number" || Number.isNaN(value)) {
            return null;
        }

        // SECTION: convert unit if needed (not implemented)
        if (outputUnit && eqReturnUnit && outputUnit.toLowerCase() !== unit.toLowerCase()) {
            throw new Error("Unit conversion is not implemented. Provide outputUnit equal to result unit.");
        }

        return { value, unit };
    } catch {
        return null;
    }
};
