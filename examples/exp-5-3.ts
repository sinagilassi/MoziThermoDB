import { ComponentSchema, type Component } from "mozithermodb-settings";
import type { MoziMatObj } from "../src/types";
import { buildBinaryMatrixRawThermoData } from "../src";

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
