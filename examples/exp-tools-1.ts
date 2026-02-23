import type { Component } from "mozithermodb-settings";
import type { RawThermoRecord } from "../src/types";
import {
    cleanRawThermoRecord,
    getComponentIdFromRawThermoRecord,
    assertRawThermoRecordMatchesComponent,
    extractComponentDataFromRawThermoRecord,
    buildComponentRawThermoData,
} from "../src/utils";

const methane = {
    name: "Methane",
    formula: "CH4",
    state: "g",
} as Component;

const methaneRaw: RawThermoRecord[] = [
    // lowercased labels to show case-insensitive matching in getComponentIdFromRawThermoRecord
    { name: "name", symbol: "name", value: "Methane", unit: "" },
    { name: "formula", symbol: "formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "A Constant", symbol: "A", value: "33298", unit: "J/kmol*K" },
    { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
    { name: "Tmin", symbol: "Tmin", value: "298.15", unit: "K" },
    { name: "Bad Row", symbol: "BAD", value: "not-a-number", unit: "-" },
];

const propaneRaw: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Propane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "C3H8", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "A Constant", symbol: "A", value: 1000, unit: "J/kmol*K" },
];

console.log("\n1) cleanRawThermoRecord");
const cleaned = cleanRawThermoRecord(methaneRaw);
console.log(cleaned);

console.log("\n2) getComponentIdFromRawThermoRecord (case-insensitive labels)");
const componentId = getComponentIdFromRawThermoRecord(methaneRaw, "Name-Formula");
console.log(componentId); // Methane-CH4

console.log("\n3) assertRawThermoRecordMatchesComponent");
assertRawThermoRecordMatchesComponent(methane, methaneRaw, "Name-Formula");
console.log("match OK");

try {
    assertRawThermoRecordMatchesComponent(methane, propaneRaw, "Name-Formula");
} catch (err) {
    console.log("expected mismatch:", err instanceof Error ? err.message : String(err));
}

console.log("\n4) extractComponentDataFromRawThermoRecord");
const extracted = extractComponentDataFromRawThermoRecord(
    methane,
    [propaneRaw, methaneRaw],
    "Name-Formula"
);
console.log(extracted);

console.log("\n5) buildComponentRawThermoData");
const payloadTemplate: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "", unit: "" },
    { name: "Formula", symbol: "Formula", value: "", unit: "" },
    { name: "A Constant", symbol: "A", value: 0, unit: "J/kmol*K" },
    { name: "B Constant", symbol: "B", value: 0, unit: "J/kmol*K" },
];

const attachedPairs = [
    { symbol: "Name", value: "Methane" },
    { symbol: "Formula", value: "CH4" },
    { symbol: "A", value: "33298" },
    { symbol: "B", value: 79933 },
    { symbol: "IGNORED", value: 123 }, // skipped (not in payload template)
];

const built = buildComponentRawThermoData(
    methane,
    attachedPairs,
    payloadTemplate,
    "Name-Formula"
);
console.log(built);
