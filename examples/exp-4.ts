// Example: build component data map using MoziData helpers

import { buildComponentData, buildData } from "../src/docs/data";
import type { RawThermoRecord } from "../src/types";
import type { Component } from "mozithermodb-settings";

const component = {
    name: "Methane",
    formula: "CH4",
    state: "g"
} as Component;


const records: RawThermoRecord[] = [
    { name: "Name", symbol: "Methane", value: "N/A", unit: "N/A" },
    { name: "Formula", symbol: "CH4", value: "N/A", unit: "N/A" },
    { name: "State", symbol: "g", value: "N/A", unit: "N/A" },
    { name: "Molecular Weight", symbol: "MW", value: 16.04, unit: "g/mol" },
    { name: "Critical Temperature", symbol: "Tc", value: 190.56, unit: "K" },
    { name: "Critical Pressure", symbol: "Pc", value: 4.5992, unit: "MPa" },
    { name: "Critical Molar Volume", symbol: "Vc", value: 0.0986, unit: "m3/kmol" },
    { name: "Critical Compressibility Factor", symbol: "Zc", value: 0.286, unit: "" },
    { name: "Acentric Factor", symbol: "AcFa", value: 0.011, unit: "" },
    { name: "Enthalpy of Formation", symbol: "EnFo", value: -74.85, unit: "kJ/mol" },
    { name: "Gibbs Energy of Formation", symbol: "GiEnFo", value: -50.8, unit: "kJ/mol" }
];

// SECTION: Build data
const buildDataRes = buildData(records, "Methane Thermo Data", "Thermodynamic properties of methane");
console.log(buildDataRes);


// SECTION: Build component data map using the helper function
const dataMap = buildComponentData(
    component,
    records,
);

console.log(dataMap);
