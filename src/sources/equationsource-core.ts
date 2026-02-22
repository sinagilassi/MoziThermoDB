import { Component, ComponentKey, set_component_id } from "mozithermodb-settings";
import type { ComponentEquationSource } from "@/types/sources";
import type { ArgMap, RetMap, ConfigArgMap } from "@/types";
import type { MoziEquation } from "@/core";
import { Source } from "./source";

export class EquationSourceCore {
    public propName: string;
    public component: Component;
    public source: Source;
    public componentKey: ComponentKey;
    public componentId: string;
    public componentEquation: ComponentEquationSource;

    constructor(
        propName: string,
        component: Component,
        source: Source,
        componentKey: ComponentKey = "Name-Formula",
    ) {
        this.propName = propName;
        this.component = component;
        this.source = source;
        this.componentKey = componentKey;

        // Keep Source.eqBuilder aligned with this wrapper's key.
        this.source.componentKey = componentKey;

        this.componentId = set_component_id(this.component, this.componentKey);
        this.componentEquation = this.getEquationFromSource();
    }

    get eq(): MoziEquation {
        return this.componentEquation.source;
    }

    get fn(): (args: ArgMap) => RetMap {
        return this.componentEquation.fn;
    }

    get inputs() {
        return this.componentEquation.inputs;
    }

    get args(): ConfigArgMap {
        return this.componentEquation.args;
    }

    get argSymbols(): string[] {
        return this.componentEquation.argSymbols;
    }

    get returns() {
        return this.componentEquation.returns;
    }

    get returnSymbols(): string[] {
        return this.componentEquation.returnSymbols;
    }

    get returnUnit(): string {
        return this.componentEquation.returnUnit;
    }

    get returnSymbol(): string {
        const fromList = this.returnSymbols[0];
        if (fromList) return fromList;

        const fromReturnConfig = Object.values(this.returns)[0]?.symbol;
        return fromReturnConfig ?? "";
    }

    private getEquationFromSource(): ComponentEquationSource {
        const equations = this.source.eqBuilder([this.component], this.propName);
        if (!equations) {
            throw new Error(`No ${this.propName} equation found for component ID: ${this.componentId}`);
        }

        const eq = equations[this.componentId];
        if (!eq) {
            throw new Error(`No ${this.propName} equation found for component ID: ${this.componentId}`);
        }

        return eq;
    }

    private buildCalcArgMap(inputArgs?: Record<string, number>): ArgMap {
        const mergedInputs: Record<string, number> = {};

        for (const [key, input] of Object.entries(this.inputs)) {
            if (typeof input.value === "number") {
                mergedInputs[key] = input.value;
            }
        }

        if (inputArgs) {
            for (const [key, value] of Object.entries(inputArgs)) {
                mergedInputs[key] = value;
            }
        }

        const argMap: ArgMap = {};

        for (const [argKey, argCfg] of Object.entries(this.args)) {
            const symbol = argCfg.symbol ?? argKey;
            const value = (argKey in mergedInputs ? mergedInputs[argKey] : mergedInputs[symbol]);

            if (typeof value !== "number" || Number.isNaN(value)) {
                throw new Error(`Missing argument value for '${argKey}' (${symbol}).`);
            }

            argMap[argKey] = {
                value,
                unit: argCfg.unit,
                symbol
            };
        }

        return argMap;
    }

    public calc(inputArgs?: Record<string, number>): RetMap | null {
        try {
            const args = this.buildCalcArgMap(inputArgs);
            return this.eq.calc(args);
        } catch {
            return null;
        }
    }
}
