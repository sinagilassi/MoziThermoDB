// Example: Python-style factory wrappers (mkdt, mkeqs, mkeq)
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentEquation } from "../src/docs/equation";
import { buildComponentData } from "../src/docs/data";
import type {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    RawThermoRecord,
    Eq
} from "../src/types";
import { mkdt, mkeq, mkeqs } from "../src/sources";

type P = "A" | "B" | "C" | "D" | "E";
type A = "T";
type R = "Cp_IG";

const params: ConfigParamMap<P> = {
    A: { name: "A constant", symbol: "A", unit: "J/kmol*K" },
    B: { name: "B constant", symbol: "B", unit: "J/kmol*K" },
    C: { name: "C constant", symbol: "C", unit: "K" },
    D: { name: "D constant", symbol: "D", unit: "J/kmol*K" },
    E: { name: "E constant", symbol: "E", unit: "K" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    Cp_IG: { name: "Heat Capacity (ideal gas)", symbol: "Cp_IG", unit: "J/kmol*K" }
};

const cpIdealGasEq: Eq<P, A> = (p, a) => {
    const T = a.T.value;
    const x = p.C.value / T;
    const y = p.E.value / T;
    const termB = (x / Math.sinh(x)) ** 2;
    const termD = (y / Math.cosh(y)) ** 2;
    const value = p.A.value + p.B.value * termB + p.D.value * termD;

    return { value, unit: "J/kmol*K", symbol: "Cp_IG" };
};

const data: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Methane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "A Constant", symbol: "A", value: 33298, unit: "J/kmol*K" },
    { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
    { name: "C Constant", symbol: "C", value: 2086.9, unit: "K" },
    { name: "D Constant", symbol: "D", value: 41602, unit: "J/kmol*K" },
    { name: "E", symbol: "E", value: 991.96, unit: "K" },
    { name: "Tmin", symbol: "Tmin", value: 298.15, unit: "K" },
    { name: "Tmax", symbol: "Tmax", value: 1300, unit: "K" }
];

const methane = {
    name: "Methane",
    formula: "CH4",
    state: "g"
} as Component;

const methaneCp = createEq(
    params,
    args,
    ret,
    cpIdealGasEq,
    "Methane Ideal Gas Cp",
    "Ideal gas heat capacity for methane"
);

// Build a model source using the same key as the wrapper defaults: Name-Formula
const modelSource = {
    dataSource: buildComponentData(methane, data, ["Name-Formula"]),
    equationSource: buildComponentEquation(methane, methaneCp, data, ["Name-Formula"])
};

// SECTION: mkdt -> DataSourceCore
const ds = mkdt(methane, modelSource, "Name-Formula");
console.log("mkdt props:", ds?.props());
console.log("mkdt prop(A):", ds?.prop("A"));

// SECTION: mkeqs -> EquationSourcesCore
const eqs = mkeqs(methane, modelSource, "Name-Formula");
console.log("mkeqs equations:", eqs?.equations());

// Create EquationSourceCore from EquationSourcesCore
const eqFromList = eqs?.eq("Cp_IG");
console.log("eqs.eq('Cp_IG') metadata:", {
    returnUnit: eqFromList?.returnUnit,
    returnSymbol: eqFromList?.returnSymbol,
    argSymbols: eqFromList?.argSymbols
});
console.log("eqs.eq('Cp_IG').calc:", eqFromList?.calc({ T: 298.15 }));

// SECTION: mkeq -> EquationSourceCore directly
const eqCore = mkeq("Cp_IG", methane, modelSource, "Name-Formula");
console.log("mkeq calc:", eqCore?.calc({ T: 400 }));

// Missing equation -> null (Python-style wrapper behavior)
const missing = mkeq("MissingProp", methane, modelSource, "Name-Formula");
console.log("mkeq missing:", missing);
