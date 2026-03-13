import type { Component } from "mozithermodb-settings";
import { describe, expect, it } from "vitest";
import { createBinaryMixturePropData, getComponentMatrixData } from "@/utils/mixture-tools";

describe("getComponentMatrixData", () => {
    const methanol = { name: "Methanol", formula: "CH3OH", state: "l" } as Component;
    const ethanol = { name: "Ethanol", formula: "C2H5OH", state: "l" } as Component;
    const components: Component[] = [methanol, ethanol];

    it("converts MoziMatObj to a 2x2 matrix using matching component key", () => {
        const propData = {
            "Methanol_Ethanol": 1,
            "Methanol_Methanol": 2,
            "Ethanol_Methanol": 3,
            "Ethanol_Ethanol": 4
        };

        const res = getComponentMatrixData(components, propData, ["Name"], "_");

        expect(res).toEqual([
            [2, 1],
            [3, 4]
        ]);
    });

    it("falls back to the next component key when the first key does not match", () => {
        const propData = {
            "CH3OH_C2H5OH": 10,
            "CH3OH_CH3OH": 11,
            "C2H5OH_CH3OH": 12,
            "C2H5OH_C2H5OH": 13
        };

        const res = getComponentMatrixData(components, propData, ["Name", "Formula"], "_");

        expect(res).toEqual([
            [11, 10],
            [12, 13]
        ]);
    });

    it("fills missing entries with NaN", () => {
        const propData = {
            "Methanol_Methanol": 7,
            "Ethanol_Ethanol": 8
        };

        const res = getComponentMatrixData(components, propData, ["Name"], "_");

        expect(res.length).toBe(2);
        expect(res[0].length).toBe(2);
        expect(res[1].length).toBe(2);
        expect(res[0][0]).toBe(7);
        expect(Number.isNaN(res[0][1])).toBe(true);
        expect(Number.isNaN(res[1][0])).toBe(true);
        expect(res[1][1]).toBe(8);
    });

    it("throws when required inputs are missing", () => {
        expect(() =>
            getComponentMatrixData(undefined as unknown as Component[], {} as Record<string, number>)
        ).toThrow("Component and propData are required to get component matrix data.");

        expect(() =>
            getComponentMatrixData(components, undefined as unknown as Record<string, number>)
        ).toThrow("Component and propData are required to get component matrix data.");
    });
});

describe("createBinaryMixturePropData", () => {
    const methanol = { name: "Methanol", formula: "CH3OH", state: "l" } as Component;
    const ethanol = { name: "Ethanol", formula: "C2H5OH", state: "l" } as Component;
    const components: Component[] = [methanol, ethanol];

    it("creates component-indexed raw records from matrix-like object data", () => {
        const propData = {
            "Methanol_Ethanol": 1,
            "Methanol_Methanol": 2,
            "Ethanol_Methanol": 3,
            "Ethanol_Ethanol": 4
        };

        const res = createBinaryMixturePropData(
            components,
            "a",
            propData,
            ["i_j_1", "i_j_2"],
            "Name",
            "_"
        );

        expect(Object.keys(res)).toEqual(["Methanol", "Ethanol"]);
        expect(res.Methanol).toEqual([
            { name: "a_i_j_1", symbol: "a_i_j_1", value: 2, unit: "1" },
            { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" }
        ]);
        expect(res.Ethanol).toEqual([
            { name: "a_i_j_1", symbol: "a_i_j_1", value: 3, unit: "1" },
            { name: "a_i_j_2", symbol: "a_i_j_2", value: 4, unit: "1" }
        ]);
    });

    it("propagates NaN for missing matrix entries", () => {
        const propData = {
            "Methanol_Methanol": 9
        };

        const res = createBinaryMixturePropData(
            components,
            "a",
            propData,
            ["i_j_1", "i_j_2"],
            "Name",
            "_"
        );

        expect(res.Methanol[0].value).toBe(9);
        expect(Number.isNaN(res.Methanol[1].value as number)).toBe(true);
        expect(Number.isNaN(res.Ethanol[0].value as number)).toBe(true);
        expect(Number.isNaN(res.Ethanol[1].value as number)).toBe(true);
    });

    it("throws when component count is not binary", () => {
        expect(() =>
            createBinaryMixturePropData(
                [methanol],
                "a",
                { "Methanol_Methanol": 1 },
                ["i_j_1", "i_j_2"],
                "Name",
                "_"
            )
        ).toThrow("Component array must contain exactly 2 components for binary mixtures.");
    });
});
