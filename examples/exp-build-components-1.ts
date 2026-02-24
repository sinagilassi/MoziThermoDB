// Example: buildComponentsEquation for multiple components using one equation template
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentsEquation } from "../src";
import { buildComponentsData } from "../src";
import type {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    RawThermoRecord,
    Eq
} from "../src/types";

type P = "A" | "B";
type A = "T";
type R = "Y";

// Simple example equation: Y = A + B*T
const params: ConfigParamMap<P> = {
    A: { name: "Intercept", symbol: "A", unit: "-" },
    B: { name: "Slope", symbol: "B", unit: "1/K" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    Y: { name: "Example Property", symbol: "Y", unit: "-" }
};

const eq: Eq<P, A> = (p, a) => ({
    value: p.A.value + p.B.value * a.T.value,
    unit: "-",
    symbol: "Y"
});

const eqTemplate = createEq(
    params,
    args,
    ret,
    eq,
    "Linear Example",
    "Y = A + B*T"
);

const methane = { name: "Methane", formula: "CH4", state: "g" } as Component;
const ethane = { name: "Ethane", formula: "C2H6", state: "g" } as Component;

const methaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Methane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Intercept", symbol: "A", value: 1.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.01, unit: "1/K" }
];

const ethaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Ethane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "C2H6", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Intercept", symbol: "A", value: 2.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.02, unit: "1/K" }
];

const rawDataBlocks = [methaneData, ethaneData];

const componentsData = buildComponentsData(
    [methane, ethane],
    rawDataBlocks,
    ["Name-Formula", "Name-State"],
    true,
    "Name-Formula"
);
// log
console.log("Built component data:", componentsData);

const componentsEquation = buildComponentsEquation(
    [methane, ethane],
    eqTemplate,
    rawDataBlocks,
    ["Name-Formula", "Name-State"],
    true,
    "Name-Formula"
);
// log
console.log("Built component equations:", componentsEquation);

console.log("Built data keys:", Object.keys(componentsData));
console.log("Built component keys:", Object.keys(componentsEquation));
console.log("Methane data (Name-Formula):", componentsData["Methane-CH4"]);
console.log("Ethane data (Name-State):", componentsData["Ethane-g"]);

const methaneEq = componentsEquation["Methane-CH4"]["Y"];
const ethaneEq = componentsEquation["Ethane-C2H6"]["Y"];

const methaneRes = methaneEq.calc({
    T: { value: 300, unit: "K", symbol: "T" }
});

const ethaneRes = ethaneEq.calc({
    T: { value: 300, unit: "K", symbol: "T" }
});

console.log("Methane result @300K:", methaneRes);
console.log("Ethane result @300K:", ethaneRes);
console.log("Name-State aliases:", {
    methaneData: !!componentsData["Methane-g"],
    ethaneData: !!componentsData["Ethane-g"],
    methane: !!componentsEquation["Methane-g"]?.Y,
    ethane: !!componentsEquation["Ethane-g"]?.Y
});
