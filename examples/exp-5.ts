// import libs
import { type Component, ComponentKey, ComponentSchema } from "mozithermodb-settings"
// ! LOCALS
import type { RawThermoRecord } from "../src/types";
import { MoziMatrixData } from './../src';


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

const mixture: Component[] = [methanol, ethanol];

// STRUCTURE:
// COLUMNS: [No.,Mixture,Name,Formula,State,a_i_1,a_i_2,b_i_1,b_i_2,c_i_1,c_i_2,alpha_i_1,alpha_i_2]
// SYMBOL: [None,None,None,None,None,a_i_1,a_i_2,b_i_1,b_i_2,c_i_1,c_i_2,alpha_i_1,alpha_i_2]
// UNIT: [None,None,None,None,None,1,1,1,1,1,1,1,1]
// VALUES:
// - [1,methanol|ethanol,methanol,CH3OH,l,0,0.300492719,0,1.564200272,0,35.05450323,0,4.481683583]
// - [2,methanol|ethanol,ethanol,C2H5OH,l,0.380229054,0,-20.63243601,0,0.059982839,0,4.481683583,0]
// - [1,methane|ethanol,methane,CH4,g,0,0.300492719,0,1.564200272,0,35.05450323,0,4.481683583]
// - [2,methane|ethanol,ethanol,C2H5OH,l,0.380229054,0,-20.63243601,0,0.059982839,0,4.481683583,0]

// NOTE: matrix data
const methanolEthanolRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 2, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 3, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 4, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 5, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 5, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 6, unit: "1" }
]

const ethanolMethanolRecords: RawThermoRecord[] = [
    { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
    { name: "Name", symbol: "-", value: "Ethanol", unit: "N/A" },
    { name: "Formula", symbol: "-", value: "C2H5OH", unit: "N/A" },
    { name: "State", symbol: "-", value: "l", unit: "N/A" },
    { name: "a_i_j_1", symbol: "a_i_j_1", value: 10, unit: "1" },
    { name: "a_i_j_2", symbol: "a_i_j_2", value: 11, unit: "1" },
    { name: "b_i_j_1", symbol: "b_i_j_1", value: 12, unit: "1" },
    { name: "b_i_j_2", symbol: "b_i_j_2", value: 13, unit: "1" },
    { name: "c_i_j_1", symbol: "c_i_j_1", value: 14, unit: "1" },
    { name: "c_i_j_2", symbol: "c_i_j_2", value: 15, unit: "1" },
    { name: "alpha_i_j_1", symbol: "alpha_i_j_1", value: 6, unit: "1" },
    { name: "alpha_i_j_2", symbol: "alpha_i_j_2", value: 7, unit: "1" }
]

const matrixData: RawThermoRecord[][] = [methanolEthanolRecords, ethanolMethanolRecords]

// SECTION: build matrix data
const moziMatrixData = new MoziMatrixData(matrixData, "Name-Formula", "Matrix Data", "Thermodynamic matrix data for methanol-ethanol mixture");

// NOTE: get property for a component
const res1 = moziMatrixData.getProperty(
    "a_i_j",
    methanol,
    "methanol|ethanol",
);
console.log(res1)

const res2 = moziMatrixData.getProperty(
    "a_i_j",
    ethanol,
    "methanol|ethanol",
);
console.log(res2)

// SECTION: get matrix property
const res3 = moziMatrixData.getMatrixProperty(
    "a_i_j", [methanol, ethanol], "methanol|ethanol"
)
console.log(res3)

const res4 = moziMatrixData.getMatrixProperty(
    "a_i_j", [methanol, methanol], "methanol|ethanol"
)
console.log(res4)

const res5 = moziMatrixData.getMatrixProperty(
    "a_i_j", [ethanol, methanol], "methanol|ethanol"
)
console.log(res5)

const res6 = moziMatrixData.getMatrixProperty(
    "a_i_j", [ethanol, ethanol], "methanol|ethanol"
)
console.log(res6)

// SECTION: get matrix property by symbol
const res7 = moziMatrixData.ij(
    "a_1_1", "methanol|ethanol"
)
console.log(res7)

const res8 = moziMatrixData.ij(
    "a_1_2", "methanol|ethanol"
)
console.log(res8)

const res9 = moziMatrixData.ij(
    "a_2_1", "methanol|ethanol"
)
console.log(res9)

const res10 = moziMatrixData.ij(
    "a_2_2", "methanol|ethanol"
)
console.log(res10)

// SECTION: ijs
const res11 = moziMatrixData.ijs(
    "a | methanol | ethanol"
)
console.log(res11)

// SECTION: mat
const res12 = moziMatrixData.mat(
    "a | methanol | ethanol"
)
console.log(res12)