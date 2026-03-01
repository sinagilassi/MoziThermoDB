// import libs
// ! LOCALS
import { ComponentDataMap } from "@/docs/data";
import { ComponentEquation, ComponentEquationMap } from "@/docs/equation";
import { BinaryMixtureData, BinaryMixtureDataMap } from "@/docs/matrix-data";
import { MoziEquation } from "@/core";
import { ArgMap, RetMap, ConfigArgMap, ConfigRetMap } from "./equations";
import { ThermoRecordMap } from "./database";

// NOTE Data Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of data records for that component, keyed by record symbol (e.g. "A", "B", etc.)
// ! This is the cleaned numeric data shape (`ThermoRecordMap`) produced by `buildData`/`buildComponentData`,
// ! not raw DB records with mixed string/number values.
// ! DataSource can hold component data only, mixture matrix map only, or both in one object.
export type MixedDataSource = Record<string, ThermoRecordMap | BinaryMixtureData>;
export type DataSource = ComponentDataMap | BinaryMixtureDataMap | MixedDataSource;

// NOTE: Equation Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of equations for that component, keyed by equation symbol (e.g. "Cp_IG", etc.)
export type EquationSource = ComponentEquationMap;

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
