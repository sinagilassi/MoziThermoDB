// Example: mkdt / mkeqs / mkeq with a multi-component modelSource
// One modelSource contains data/equations for multiple components; wrappers select by component.
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentsEquation } from "../src/docs/equation";
import { buildComponentsData } from "../src/docs/data";
import type {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    RawThermoRecord,
    Eq
} from "../src/types";
import { mkdt, mkeq, mkeqs } from "../src/sources";

type P = "A" | "B";
type A = "T";
type R = "Y";

// Y = A + B*T
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

const components = [methane, ethane];
const rawDataBlocks = [methaneData, ethaneData];

const eqTemplate = createEq(params, args, ret, eq, "Linear Example", "Y = A + B*T");

// Shared multi-component modelSource
const modelSource = {
    dataSource: buildComponentsData(
        components,
        rawDataBlocks,
        ["Name-State"],
        true,
        "Name-Formula"
    ),
    equationSource: buildComponentsEquation(
        components,
        eqTemplate,
        rawDataBlocks,
        ["Name-State"],
        true,
        "Name-Formula"
    )
};

console.log("Shared model source keys:", {
    data: Object.keys(modelSource.dataSource),
    eqs: Object.keys(modelSource.equationSource)
});

for (const component of components) {
    const label = `${component.name}-${component.state}`;

    const ds = mkdt(component, modelSource, "Name-State");
    const eqs = mkeqs(component, modelSource, "Name-State");
    const eqCore = mkeq("Y", component, modelSource, "Name-State");

    console.log(`\nComponent wrapper view: ${label}`);
    console.log("mkdt props:", ds?.props());
    console.log("mkdt A:", ds?.prop("A"));
    console.log("mkeqs equations:", eqs?.equations());
    console.log("mkeq inputs:", eqCore?.inputs);
    console.log("mkeq calc @T=300:", eqCore?.calc({ T: 300 }));
}

// Python-style null behavior with multi-component modelSource
console.log("\nMissing equation (Methane):", mkeq("MissingProp", methane, modelSource, "Name-State"));
