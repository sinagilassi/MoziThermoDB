// import libs
// ! LOCALS
import { ComponentData } from "@/docs/data";
import { ComponentEquation } from "@/docs/equation";

// NOTE Data Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of data records for that component, keyed by record symbol (e.g. "A", "B", etc.)
export type DataSource = { [key: string]: ComponentData };

// NOTE: Equation Source
// ! key: component id (e.g. "Methane-CH4")
// ! value: map of equations for that component, keyed by equation symbol (e.g. "Cp_IG", etc.)
export type EquationSource = { [key: string]: ComponentEquation };

// NOTE: Component Source
export type ModelSource = {
    dataSource: DataSource;
    equationSource: EquationSource;
}