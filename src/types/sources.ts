// import libs
// ! LOCALS
import { ComponentData } from "@/docs/data";
import { ComponentEquation } from "@/docs/equation";
import { MoziEquation } from "@/core";
import { ArgMap, RetMap, ConfigArgMap, ConfigRetMap } from "./equations";

// NOTE Data Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of data records for that component, keyed by record symbol (e.g. "A", "B", etc.)
// ! This is the cleaned numeric data shape (`ThermoRecordMap`) produced by `buildData`/`buildComponentData`,
// ! not raw DB records with mixed string/number values.
export type DataSource = ComponentData;

// NOTE: Equation Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of equations for that component, keyed by equation symbol (e.g. "Cp_IG", etc.)
export type EquationSource = { [key: string]: ComponentEquation };

// NOTE: Component Source
export type ModelSource = {
    dataSource: DataSource;
    equationSource: EquationSource;
}

// NOTE: Equation input args (nullable until externally supplied)
export type ArgInput = { value: number | null; unit: string; symbol: string };
export type ArgInputMap = Record<string, ArgInput>;

// NOTE: Component equation source (prepared for execution)
export type ComponentEquationSource = {
    source: MoziEquation;
    inputs: ArgInputMap;
    args: ConfigArgMap;
    argSymbols: string[];
    returns: ConfigRetMap;
    returnSymbols: string[];
    fn: (args: ArgMap) => RetMap;
    returnUnit: string;
}

// NOTE: Exec result tuple [values, resultMap]
export type ExecEqResult = [
    number[],
    Record<string, { propertyName: string; value: number; unit: string; symbol: string }>
];
