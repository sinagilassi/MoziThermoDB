// Example: build component data map using MoziData helpers

import { buildComponentData } from "../src/docs/data";
import type { ThermoRecord } from "../src/types";
import type { Component } from "mozithermodb-settings";

const component = {
    name: "Methane",
    formula: "CH4",
    state: "g"
} as Component;


const records: ThermoRecord[] = [
    { name: "Molecular Weight", symbol: "MW", value: 16.04, unit: "g/mol" },
    { name: "Critical Temperature", symbol: "Tc", value: 190.56, unit: "K" },
    { name: "Critical Pressure", symbol: "Pc", value: 4.5992, unit: "MPa" },
    { name: "Critical Molar Volume", symbol: "Vc", value: 0.0986, unit: "m3/kmol" },
    { name: "Critical Compressibility Factor", symbol: "Zc", value: 0.286, unit: "" },
    { name: "Acentric Factor", symbol: "AcFa", value: 0.011, unit: "" },
    { name: "Enthalpy of Formation", symbol: "EnFo", value: -74.85, unit: "kJ/mol" },
    { name: "Gibbs Energy of Formation", symbol: "GiEnFo", value: -50.8, unit: "kJ/mol" }
];

const dataMap = buildComponentData(
    records,
    component,
    "Name-Formula",
    "Methane Thermo Data",
    "Ideal-gas Cp coefficients with temperature range"
);

console.log(dataMap);
