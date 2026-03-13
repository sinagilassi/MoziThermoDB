import type { Component } from "mozithermodb-settings";
import { describe, expect, it } from "vitest";
import { buildBinaryMatrixRawThermoData } from "@/thermo-data";

describe("buildBinaryMatrixRawThermoData", () => {
    const methanol = { name: "Methanol", formula: "CH3OH", state: "l" } as Component;
    const ethanol = { name: "Ethanol", formula: "C2H5OH", state: "l" } as Component;
    const components: Component[] = [methanol, ethanol];

    it("builds merged id + property records for both components", () => {
        const propData = {
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
            }
        };

        const res = buildBinaryMatrixRawThermoData(
            components,
            "Name",
            "Name-Formula",
            propData,
            "|",
            "12",
            ["i_j_1", "i_j_2"],
            "_"
        );

        // NOTE: log res
        console.log(JSON.stringify(res, null, 2));

        const methanolKey = "Methanol-CH3OH";
        const ethanolKey = "Ethanol-C2H5OH";

        expect(Object.keys(res)).toEqual([methanolKey, ethanolKey]);
        expect(res[methanolKey].slice(0, 4)).toEqual([
            { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "" },
            { name: "Name", symbol: "-", value: "Methanol", unit: "" },
            { name: "Formula", symbol: "-", value: "CH3OH", unit: "" },
            { name: "State", symbol: "-", value: "l", unit: "" }
        ]);
        expect(res[methanolKey].slice(4)).toEqual([
            { name: "a_i_j_1", symbol: "a_i_j_1", value: 1, unit: "1" },
            { name: "a_i_j_2", symbol: "a_i_j_2", value: 2, unit: "1" },
            { name: "b_i_j_1", symbol: "b_i_j_1", value: 10, unit: "1" },
            { name: "b_i_j_2", symbol: "b_i_j_2", value: 20, unit: "1" }
        ]);

        expect(res[ethanolKey].slice(0, 4)).toEqual([
            { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "" },
            { name: "Name", symbol: "-", value: "Ethanol", unit: "" },
            { name: "Formula", symbol: "-", value: "C2H5OH", unit: "" },
            { name: "State", symbol: "-", value: "l", unit: "" }
        ]);
        expect(res[ethanolKey].slice(4)).toEqual([
            { name: "a_i_j_1", symbol: "a_i_j_1", value: 3, unit: "1" },
            { name: "a_i_j_2", symbol: "a_i_j_2", value: 4, unit: "1" },
            { name: "b_i_j_1", symbol: "b_i_j_1", value: 30, unit: "1" },
            { name: "b_i_j_2", symbol: "b_i_j_2", value: 40, unit: "1" }
        ]);
    });

    it("throws when component count is not binary", () => {
        expect(() =>
            buildBinaryMatrixRawThermoData(
                [methanol],
                "Name",
                "Name-Formula",
                { a: { "Methanol-CH3OH_Methanol-CH3OH": 1 } }
            )
        ).toThrow("Component array must contain exactly 2 components for binary mixtures.");
    });
});
