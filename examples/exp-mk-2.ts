// Example: mkeq with multiple args where runtime args are P and T,
// while Tc and Pc are auto-filled from component data.
// Similar to exp-source-1 behavior: Source.eqBuilder preloads equation inputs from datasource symbols.
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
import { mkeq } from "../src/sources";

type P = "Omega";
type A = "P" | "T" | "Tc" | "Pc";
type R = "Phi_r";

// This parameter is configured from component data during equation build.
const params: ConfigParamMap<P> = {
    Omega: { name: "Acentric factor", symbol: "Omega", unit: "-" }
};

const args: ConfigArgMap<A> = {
    P: { name: "Pressure", symbol: "P", unit: "Pa" },
    T: { name: "Temperature", symbol: "T", unit: "K" },
    Tc: { name: "Critical Temperature", symbol: "Tc", unit: "K" },
    Pc: { name: "Critical Pressure", symbol: "Pc", unit: "Pa" }
};

const ret: ConfigRetMap<R> = {
    Phi_r: { name: "Reduced PT product", symbol: "Phi_r", unit: "-" }
};

// Dimensionless example that uses:
// - runtime args: P, T
// - auto-filled args: Tc, Pc
// - configured parameter from data: Omega
// Phi_r = (1 + Omega) * (T / Tc) * (P / Pc)
const reducedPTProductEq: Eq<P, A> = (p, a) => {
    const value = (1 + p.Omega.value) * (a.T.value / a.Tc.value) * (a.P.value / a.Pc.value);
    return { value, unit: "-", symbol: "Phi_r" };
};

const methane = {
    name: "Methane",
    formula: "CH4",
    state: "g"
} as Component;

// Include Omega (parameter) plus Tc and Pc (args) in component data.
const data: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Methane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Acentric factor", symbol: "Omega", value: 0.011, unit: "-" },
    { name: "Critical Temperature", symbol: "Tc", value: 190.56, unit: "K" },
    { name: "Critical Pressure", symbol: "Pc", value: 4_599_000, unit: "Pa" },
    { name: "Tmin", symbol: "Tmin", value: 90, unit: "K" },
    { name: "Tmax", symbol: "Tmax", value: 625, unit: "K" }
];

const reducedEqTemplate = createEq(
    params,
    args,
    ret,
    reducedPTProductEq,
    "Reduced PT Product",
    "Computes Phi_r = (1 + Omega) * (T / Tc) * (P / Pc)"
);

const modelSource = {
    dataSource: buildComponentData(methane, data, ["Name-Formula"]),
    equationSource: buildComponentEquation(methane, reducedEqTemplate, data, ["Name-Formula"])
};

const eqCore = mkeq("Phi_r", methane, modelSource, "Name-Formula");

console.log("Equation core exists:", !!eqCore);
console.log("Configured parameter Omega (from data):", eqCore?.eq.params?.Omega);
console.log("Prepared inputs (Tc/Pc auto-filled from data, P/T remain null):", eqCore?.inputs);
console.log("Pc preloaded value:", eqCore?.inputs.Pc);
console.log("Tc preloaded value:", eqCore?.inputs.Tc);
console.log("P placeholder value:", eqCore?.inputs.P);
console.log("T placeholder value:", eqCore?.inputs.T);
console.log("Equation symbols:", eqCore?.argSymbols);

// Only provide P and T at runtime; Tc and Pc are taken from component data automatically.
const res = eqCore?.calc({ P: 101325, T: 298.15 });
console.log("Result (Phi_r = (1 + Omega)*(T/Tc)*(P/Pc)):", res);

// Missing runtime P/T still fails (returns null), because only Tc and Pc are auto-filled.
console.log("Result without runtime P/T (expected null):", eqCore?.calc());
