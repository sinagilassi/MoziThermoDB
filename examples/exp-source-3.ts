// Example: Build BinaryMixtureData, then build modelSource and matrix wrapper via mkmat
import type { Component } from "mozithermodb-settings";
import type { RawThermoRecord } from "../src/types";
import { buildBinaryMixtureData } from "../src/docs/matrix-data";
import { mkmat, Source } from "../src/sources";

const methanol = {
    name: "Methanol",
    formula: "CH3OH",
    state: "l"
} as Component;

const ethanol = {
    name: "Ethanol",
    formula: "C2H5OH",
    state: "l"
} as Component;

const mixture: Component[] = [methanol, ethanol];

// Matrix-shaped raw records for one binary mixture (2 rows: one per component)
const methanolRow: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "Methanol|Ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 4, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 5, unit: "1" }
];

const ethanolRow: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "Methanol|Ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Ethanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "C2H5OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 2, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 3, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 6, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 7, unit: "1" }
];

const matrixData: RawThermoRecord[][] = [methanolRow, ethanolRow];

// 1) Build all mixture aliases -> BinaryMixtureData map keyed by mixture-id aliases
const allBinaryData = buildBinaryMixtureData(mixture, matrixData);
const mixtureId = "Methanol-CH3OH|Ethanol-C2H5OH";
const binaryMixtureData =
    allBinaryData[mixtureId] ??
    Object.values(allBinaryData)[0] ??
    {};

// 2) Build model source with DataSource = BinaryMixtureData
const modelSource = {
    dataSource: binaryMixtureData,
    equationSource: {}
};

console.log("Model source built from mixture data:");
console.log("dataSource property symbols:", Object.keys(modelSource.dataSource));
console.log("equationSource keys:", Object.keys(modelSource.equationSource));

// Optional: Source instance (works with the model source contract)
const source = new Source(modelSource, "Name-Formula");
console.log("Source datasource symbols:", Object.keys(source.datasource));

// 3) Build matrix wrapper from components + modelSource + mixtureKey
const matSource = mkmat(mixture, modelSource, "Name-Formula");

if (!matSource) {
    console.log("Failed to create matrix source.");
} else {
    console.log("Resolved mixture ids:", matSource.mixtureIds());
    console.log("Available props:", matSource.props());
    console.log("a matrix:", matSource.mat("a_methanol_ethanol", mixture, "methanol|ethanol"));
    console.log("a_1_2:", matSource.ij("a_1_2", "methanol|ethanol"));
}
