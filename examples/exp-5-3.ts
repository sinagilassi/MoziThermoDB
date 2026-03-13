// import libs
import { ComponentSchema, type Component } from "mozithermodb-settings";
import type { MoziMatObj } from "../src/types";
import { buildBinaryMatrixRawThermoData } from "../src";
import { MoziMatrixData, BinaryMixtureDataMap, buildBinaryMixturesData } from './../src';
import type { RawThermoRecord } from "../src/types";

// SECTION: components
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

const components: Component[] = [methanol, ethanol];

const propData: Record<string, MoziMatObj> = {
    a: {
        "Methanol-CH3OH_Methanol-CH3OH": 1,
        "Methanol-CH3OH_Ethanol-C2H5OH": 2,
        "Ethanol-C2H5OH_Methanol-CH3OH": 3,
        "Ethanol-C2H5OH_Ethanol-C2H5OH": 4
    },
    b: {
        "Methanol-CH3OH_Methanol-CH3OH": 10,
        "Methanol-CH3OH_Ethanol-C2H5OH": 20,
        "Ethanol-C2H5OH_Methanol-CH3OH": 30,
        "Ethanol-C2H5OH_Ethanol-C2H5OH": 40
    },
    alpha: {
        "Methanol-CH3OH_Methanol-CH3OH": 100,
        "Methanol-CH3OH_Ethanol-C2H5OH": 200,
        "Ethanol-C2H5OH_Methanol-CH3OH": 300,
        "Ethanol-C2H5OH_Ethanol-C2H5OH": 400
    }
};

const binaryRawData = buildBinaryMatrixRawThermoData(
    components,
    "Name",
    "Name-Formula",
    propData,
    "|",
    "12",
    ["i_j_1", "i_j_2"],
    "_"
);

console.log("Binary Matrix Raw Thermo Data:");
for (const [componentId, records] of Object.entries(binaryRawData)) {
    console.log(`\nComponent: ${componentId}`);
    console.table(records);
}

// map data
const methanolEthanolData = binaryRawData["Methanol-CH3OH"];
const ethanolMethanolData = binaryRawData["Ethanol-C2H5OH"];

// SECTION: Build MoziMatrixData from the binary raw data
const matrixData: RawThermoRecord[][] = [methanolEthanolData, ethanolMethanolData]

const mixtures: Component[][] = [
    [methanol, ethanol],
];

// SECTION: build binary mixture data
const binaryMixtureData = buildBinaryMixturesData(mixtures, matrixData);
console.log("Built binary mixture data:", binaryMixtureData);
console.log("Built mixture ids:", Object.keys(binaryMixtureData));

// NOTE: access MoziMatrixData for a specific property and mixture id
const mixtureId = "Methanol|Ethanol";
const propertySymbol = "a";

const moziMatrixDataForMixture = binaryMixtureData[mixtureId]?.[propertySymbol];

if (!moziMatrixDataForMixture) {
    console.error(`No MoziMatrixData found for mixture id "${mixtureId}" and property "${propertySymbol}".`);
}

// >> mat
const aMatrix = moziMatrixDataForMixture?.mat("a_i_j", [methanol, ethanol]);
console.log(`a matrix for mixture "${mixtureId}":`, aMatrix);

const aMatrixReverse = moziMatrixDataForMixture?.mat("a_i_j", [ethanol, methanol]);
console.log(`a matrix reveres for mixture "${mixtureId}":`, aMatrixReverse);

// >> matDict
const aMatDict = moziMatrixDataForMixture?.matDict("a_i_j", [methanol, ethanol]);
console.log(`a matrix dict for mixture "${mixtureId}":`, aMatDict);

