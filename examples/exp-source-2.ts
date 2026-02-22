// Example: Using Source with multi-component modelSource (buildComponentsData + buildComponentsEquation)
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentsEquation } from "../src/docs/equation";
import { buildComponentsData } from "../src/docs/data";
import type { ConfigParamMap, ConfigArgMap, ConfigRetMap, RawThermoRecord, Eq } from "../src/types";
import { Source, calcEq } from "../src/sources";

type P = "A" | "B";
type A = "T";
type R = "Y";

// Simple linear property equation used for two components:
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

const methane = {
    name: "Methane",
    formula: "CH4",
    state: "g"
} as Component;

const ethane = {
    name: "Ethane",
    formula: "C2H6",
    state: "g"
} as Component;

const methaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Methane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Intercept", symbol: "A", value: 1.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.01, unit: "1/K" },
    { name: "Tmin", symbol: "Tmin", value: 100, unit: "K" },
    { name: "Tmax", symbol: "Tmax", value: 500, unit: "K" }
];

const ethaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Ethane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "C2H6", unit: "" },
    { name: "State", symbol: "State", value: "g" as const, unit: "" },
    { name: "Intercept", symbol: "A", value: 2.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.02, unit: "1/K" },
    { name: "Tmin", symbol: "Tmin", value: 100, unit: "K" },
    { name: "Tmax", symbol: "Tmax", value: 500, unit: "K" }
];

const rawDataBlocks = [methaneData, ethaneData];

// Build one reusable equation template
const eqTemplate = createEq(params, args, ret, eq, "Linear Example", "Y = A + B*T");

// Build multi-component model source parts
const dataSource = buildComponentsData(
    [methane, ethane],
    rawDataBlocks,
    ["Name-State"],
    true,
    "Name-Formula"
);

const equationSource = buildComponentsEquation(
    [methane, ethane],
    eqTemplate,
    rawDataBlocks,
    ["Name-State"],
    true,
    "Name-Formula"
);

// SECTION: Build and use Source
const modelSource = {
    dataSource,
    equationSource
};
// log
console.log("Model source: ", modelSource);

const source = new Source(modelSource, "Name-State");

console.log("Model source data keys:", Object.keys(modelSource.dataSource));
console.log("Model source equation keys:", Object.keys(modelSource.equationSource));

// Extract data/equation for each component
for (const componentId of ["Methane-g", "Ethane-g"]) {
    console.log(`\nComponent: ${componentId}`);
    console.log("Data A:", source.dataExtractor(componentId, "A"));
    console.log("Equation Y symbol:", source.eqExtractor(componentId, "Y")?.equationSymbol);
}

// Build and execute equation source for multiple components at once
const eqSrc = source.eqBuilder([methane, ethane], "Y");
console.log("\nBuilt equation source keys:", eqSrc ? Object.keys(eqSrc) : null);

const execResult = source.execEq([methane, ethane], eqSrc!, { T: 300 });
console.log("execEq([methane, ethane], T=300):", execResult);

// Direct calcEq on one component's prepared equation source
if (eqSrc?.["Methane-g"]) {
    const direct = calcEq(eqSrc["Methane-g"], { T: 300 });
    console.log("Direct calcEq (Methane-g):", direct);
}
