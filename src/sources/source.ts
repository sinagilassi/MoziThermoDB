// import libs
import {
    Component,
    ComponentKey,
    set_component_id
} from "mozithermodb-settings";
// ! LOCALS
import type {
    ArgInputMap,
    ComponentEquationSource,
    DataSource,
    EquationSource,
    ExecEqResult,
    ModelSource
} from "@/types/sources";
import type { ThermoRecordMap } from "@/types";
import type { ComponentEquation } from "@/docs/equation";
import type { ConfigArgMap, Structure, ArgMap, RetMap } from "@/types";
import type { MoziEquation } from "@/core";

type RecordEntry = { value: number; unit: string; symbol: string };

export class Source {
    // NOTE: variables
    public modelSource?: ModelSource;
    public componentKey: ComponentKey;

    private _dataSource?: DataSource;
    private _equationSource?: EquationSource;

    constructor(
        modelSource?: ModelSource,
        componentKey: ComponentKey = "Name-State",
    ) {
        this.modelSource = modelSource;
        this.componentKey = componentKey;

        if (!modelSource) {
            this._dataSource = undefined;
            this._equationSource = undefined;
        } else {
            const [dataSource, equationSource] = this.setSource(modelSource);
            this._dataSource = dataSource ?? undefined;
            this._equationSource = equationSource ?? undefined;
        }
    }

    public toString() {
        return `Source(datasource=${JSON.stringify(this.datasource)}, equationsource=${JSON.stringify(this.equationsource)})`;
    }

    // NOTE: datasource
    get datasource(): DataSource {
        if (!this._dataSource) return {};
        return this._dataSource;
    }

    // NOTE: equationsource
    get equationsource(): EquationSource {
        if (!this._equationSource) return {};
        return this._equationSource;
    }

    public setSource(modelSource?: ModelSource | null): [DataSource | null, EquationSource | null] {
        try {
            if (!modelSource) return [{}, {}];
            return [modelSource.dataSource, modelSource.equationSource];
        } catch {
            return [null, null];
        }
    }

    // SECTION: extractors
    public eqExtractor(componentId: string, propName: string): MoziEquation | null {
        try {
            const eqSource = this.equationsource;
            if (!eqSource) return null;

            if (!(componentId in eqSource)) return null;
            if (!(propName in eqSource[componentId])) return null;

            return eqSource[componentId][propName];
        } catch {
            return null;
        }
    }

    public componentEqExtractor(componentId: string): ComponentEquation | null {
        try {
            const eqSource = this.equationsource;
            if (!eqSource) return null;
            if (!(componentId in eqSource)) return null;

            return eqSource[componentId];
        } catch {
            return null;
        }
    }

    private isRecordEntry(value: unknown): value is RecordEntry {
        if (!value || typeof value !== "object") return false;
        const v = value as Record<string, unknown>;
        return typeof v.value === "number" && typeof v.unit === "string" && typeof v.symbol === "string";
    }

    private isThermoRecordMap(value: unknown): value is ThermoRecordMap {
        if (!value || typeof value !== "object") return false;
        const entries = Object.values(value as Record<string, unknown>);
        if (entries.length === 0) return true;
        return entries.every(entry => this.isRecordEntry(entry));
    }

    private normalizeComponentData(componentId: string): ThermoRecordMap | null {
        const ds = this.datasource;
        if (!ds || !(componentId in ds)) return null;

        const raw = (ds as Record<string, unknown>)[componentId];
        if (this.isThermoRecordMap(raw)) return raw;

        if (raw && typeof raw === "object") {
            const merged: ThermoRecordMap = {};
            for (const value of Object.values(raw as Record<string, unknown>)) {
                if (this.isThermoRecordMap(value)) {
                    Object.assign(merged, value);
                }
            }
            return Object.keys(merged).length > 0 ? merged : null;
        }

        return null;
    }

    public dataExtractor(componentId: string, propName: string): RecordEntry | null {
        try {
            const dataMap = this.normalizeComponentData(componentId);
            if (!dataMap) return null;

            const record = dataMap[propName];
            if (record && this.isRecordEntry(record)) return record;

            return null;
        } catch {
            return null;
        }
    }

    public componentDataExtractor(componentId: string): ThermoRecordMap | null {
        try {
            return this.normalizeComponentData(componentId);
        } catch {
            return null;
        }
    }

    // SECTION: args helpers
    public checkArgs(componentId: string, args: ConfigArgMap): Record<string, Structure> {
        const dataMap = this.normalizeComponentData(componentId);
        if (!dataMap) throw new Error("Component not in datasource.");

        const datasourceSymbols = new Set<string>(Object.keys(dataMap));
        datasourceSymbols.add("P");
        datasourceSymbols.add("T");

        const requiredArgs: Record<string, Structure> = {};
        for (const [, value] of Object.entries(args)) {
            if (datasourceSymbols.has(value.symbol)) {
                requiredArgs[value.symbol] = value;
            } else {
                throw new Error("Args not in datasource.");
            }
        }

        return requiredArgs;
    }

    public buildArgs(
        componentId: string,
        args: Record<string, Structure>,
        ignoreSymbols?: string[],
    ): ArgInputMap {
        const dataMap = this.normalizeComponentData(componentId);
        if (!dataMap) throw new Error("Component not in datasource.");

        const res: ArgInputMap = {};

        for (const [, v] of Object.entries(args)) {
            const symbol = v.symbol;
            const unit = v.unit;
            const shouldIgnore = ignoreSymbols ? ignoreSymbols.includes(symbol) : false;

            if (!shouldIgnore && symbol in dataMap) {
                const record = dataMap[symbol];
                res[symbol] = {
                    value: record.value,
                    symbol,
                    unit
                };
            } else {
                res[symbol] = {
                    value: null,
                    symbol,
                    unit
                };
            }
        }

        return res;
    }

    // SECTION: equations
    public eqBuilder(
        components: Component[],
        propName: string,
    ): Record<string, ComponentEquationSource> | null {
        if (!this.equationsource) {
            throw new Error("Equation source is not defined.");
        }

        if (!propName || propName.trim().length === 0) {
            throw new Error("Property name cannot be empty.");
        }

        const componentIds = components.map(component =>
            set_component_id(component, this.componentKey)
        );

        for (const componentId of componentIds) {
            if (!this.equationsource[componentId] || !(propName in this.equationsource[componentId])) {
                return null;
            }
        }

        const eqSrcComp: Record<string, ComponentEquationSource> = {};

        for (const componentId of componentIds) {
            const eq = this.eqExtractor(componentId, propName);
            if (!eq) continue;

            const args = eq.configArguments;
            const requiredArgs = this.checkArgs(componentId, args);
            const inputArgs = this.buildArgs(componentId, requiredArgs);

            const returns = eq.configReturn;

            eqSrcComp[componentId] = {
                source: eq,
                inputs: inputArgs,
                args,
                argSymbols: eq.argumentSymbolList,
                returns,
                returnSymbols: eq.returnSymbolList,
                fn: (a: ArgMap) => eq.calc(a),
                returnUnit: eq.returnUnit
            };
        }

        return eqSrcComp;
    }

    public execEq(
        components: Component[],
        eqSrcComp: Record<string, ComponentEquationSource>,
        argsValues?: Record<string, number>
    ): ExecEqResult | null {
        if (!Array.isArray(components)) return null;
        if (!eqSrcComp || typeof eqSrcComp !== "object") return null;

        const componentIds = components.map(component =>
            set_component_id(component, this.componentKey)
        );

        for (const id of componentIds) {
            if (!(id in eqSrcComp)) return null;
        }

        const values: number[] = [];
        const results: Record<string, { propertyName: string; value: number; unit: string; symbol: string }> = {};

        for (const componentId of componentIds) {
            const entry = eqSrcComp[componentId];
            const inputs = { ...entry.inputs };

            if (argsValues) {
                for (const [key, value] of Object.entries(argsValues)) {
                    if (key in inputs) {
                        inputs[key] = { ...inputs[key], value };
                    }
                }
            }

            const missing = Object.entries(inputs)
                .filter(([, v]) => v.value === null)
                .map(([k]) => k);

            if (missing.length > 0) {
                throw new Error(`Missing argument values for: ${missing.join(", ")}`);
            }

            const argsForCalc: ArgMap = {};
            for (const [key, value] of Object.entries(inputs)) {
                argsForCalc[key] = {
                    value: value.value as number,
                    unit: value.unit,
                    symbol: value.symbol
                };
            }

            const result = entry.source.calc(argsForCalc) as RetMap;

            const retNames = Object.values(entry.returns).map(r => r.name).join(", ");
            const retSymbols = Object.values(entry.returns).map(r => r.symbol).join(", ");

            values.push(result.value);
            results[componentId] = {
                propertyName: retNames,
                value: result.value,
                unit: result.unit,
                symbol: result.symbol ?? retSymbols
            };
        }

        return [values, results];
    }

    public getComponentData(componentId: string, components: Component[]): Record<string, unknown> | null {
        if (typeof componentId !== "string") return null;
        if (!Array.isArray(components)) return null;

        const componentIds = components.map(component =>
            set_component_id(component, this.componentKey)
        );

        if (!componentIds.includes(componentId)) return null;

        const data: Record<string, unknown> = {};

        const ds = this.normalizeComponentData(componentId);
        if (ds) Object.assign(data, ds);

        const eqs = this.equationsource[componentId];
        if (eqs) Object.assign(data, eqs);

        return data;
    }

    public isPropAvailable(componentId: string, propName: string): boolean {
        return this.isPropEqAvailable(componentId, propName) || this.isPropDataAvailable(componentId, propName);
    }

    public isPropEqAvailable(componentId: string, propName: string): boolean {
        const eqs = this.equationsource;
        return !!(eqs && eqs[componentId] && propName in eqs[componentId]);
    }

    public isPropDataAvailable(componentId: string, propName: string): boolean {
        const dataMap = this.normalizeComponentData(componentId);
        return !!(dataMap && propName in dataMap);
    }
}
