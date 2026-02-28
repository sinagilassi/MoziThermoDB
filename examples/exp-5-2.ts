// import libs
import { type Component, ComponentSchema } from "mozithermodb-settings";
// ! LOCALS
import type { RawThermoRecord } from "../src/types";
import { buildBinaryMixturesData, MoziMatrixData } from "./../src";

// NOTE: components
const methanol = ComponentSchema.parse({
    name: "Methanol",
    formula: "CH3OH",
    state: "l"
});

const ethanol = ComponentSchema.parse({
    name: "Ethanol",
    formula: "C2H5OH",
    state: "l"
});

const methane = ComponentSchema.parse({
    name: "Methane",
    formula: "CH4",
    state: "g"
});

// SECTION: matrix data
const methanolEthanolRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol | ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 4, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 5, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 8, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 9, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 5, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 6, unit: "1" }
];

const ethanolMethanolRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol | ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Ethanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "C2H5OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 2, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 3, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 6, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 7, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 10, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 11, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 6, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 7, unit: "1" }
];

const methanolMethaneRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol | methane", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 10, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 40, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 50, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 80, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 90, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 5, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 6, unit: "1" }
];

const methaneMethanolRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol | methane", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Methane", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "CH4", unit: "N/A" },
    { name: "State", symbol: "-", value: "g", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 200, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 300, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 600, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 700, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 1000, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 1100, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 6, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 7, unit: "1" }
];

const matrixData: RawThermoRecord[][] = [
    methanolEthanolRecords,
    ethanolMethanolRecords,
    methanolMethaneRecords,
    methaneMethanolRecords
];

const mixtures: Component[][] = [
    [methanol, ethanol],
    [methanol, methane]
];

// SECTION: build binary mixtures data (more than one mixture)
const binaryMixturesData = buildBinaryMixturesData(mixtures, matrixData);
console.log("Built binary mixtures data:", binaryMixturesData);
console.log("Built mixture ids:", Object.keys(binaryMixturesData));

// SECTION: access property matrix source for each mixture
const methanolEthanolId = "methanol|ethanol";
const methanolMethaneId = "methanol|methane";
// reverse
const ethanolMethanolId = "ethanol|methanol";
const methaneMethanolId = "methane|methanol";

const methanolEthanolASrc: MoziMatrixData = binaryMixturesData[methanolEthanolId]["a"];
const methanolMethaneASrc: MoziMatrixData = binaryMixturesData[methanolMethaneId]["a"];

console.log("a matrix (methanol|ethanol):", methanolEthanolASrc.mat("a_i_j", [methanol, ethanol]));
console.log("a matrix (methanol|methane):", methanolMethaneASrc.mat("a_i_j", [methanol, methane]));

const ethanolMethanolASrc: MoziMatrixData = binaryMixturesData[ethanolMethanolId]["a"];
const methaneMethanolASrc: MoziMatrixData = binaryMixturesData[methaneMethanolId]["a"];

console.log("a matrix (ethanol|methanol):", ethanolMethanolASrc.mat("a_i_j", [ethanol, methanol]));
console.log("a matrix (methane|methanol):", methaneMethanolASrc.mat("a_i_j", [methane, methanol]));
