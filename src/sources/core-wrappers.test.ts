import { describe, it, expect } from "vitest";
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentEquation } from "@/docs/equation";
import { buildComponentData } from "@/docs/data";
import type {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    ThermoRecord,
    Eq
} from "@/types";
import type { ModelSource } from "@/types/sources";
import { Source } from "@/sources/source";
import { DataSourceCore } from "@/sources/datasource-core";
import { EquationSourcesCore } from "@/sources/equationsources-core";
import { EquationSourceCore } from "@/sources/equationsource-core";
import { MatrixDataSourceCore } from "@/sources/matrixdatasource-core";
import { mkeq, mkeqs, mkdt, mkmat } from "@/sources/main";
import { MoziMatrixData } from "@/core";
import type { RawThermoRecord } from "@/types";
import { buildBinaryMixtureData } from "@/docs/matrix-data";

type P = "A" | "B" | "C" | "D" | "E";
type A = "T";
type R = "Cp_IG";

const params: ConfigParamMap<P> = {
    A: { name: "A constant", symbol: "A", unit: "J/kmol*K" },
    B: { name: "B constant", symbol: "B", unit: "J/kmol*K" },
    C: { name: "C constant", symbol: "C", unit: "K" },
    D: { name: "D constant", symbol: "D", unit: "J/kmol*K" },
    E: { name: "E", symbol: "E", unit: "K" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    Cp_IG: { name: "Heat Capacity (ideal gas)", symbol: "Cp_IG", unit: "J/kmol*K" }
};

const eq: Eq<P, A> = (p, a) => {
    const T = a.T.value;
    const x = p.C.value / T;
    const y = p.E.value / T;
    const termB = (x / Math.sinh(x)) ** 2;
    const termD = (y / Math.cosh(y)) ** 2;
    const res = p.A.value + p.B.value * termB + p.D.value * termD;
    return { value: res, unit: "J/kmol*K", symbol: "Cp_IG" };
};

const data: ThermoRecord[] = [
    { name: "A Constant", symbol: "A", value: 33298, unit: "J/kmol*K" },
    { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
    { name: "C Constant", symbol: "C", value: 2086.9, unit: "K" },
    { name: "D Constant", symbol: "D", value: 41602, unit: "J/kmol*K" },
    { name: "E", symbol: "E", value: 991.96, unit: "K" },
    { name: "Tmin", symbol: "Tmin", value: 298.15, unit: "K" },
    { name: "Tmax", symbol: "Tmax", value: 1300, unit: "K" }
];

function buildFixture(): { component: Component; modelSource: ModelSource; source: Source } {
    const methane = {
        name: "Methane",
        formula: "CH4",
        state: "g"
    } as Component;

    const methaneCp = createEq(params, args, ret, eq, "Methane Ideal Gas Cp", "Ideal gas heat capacity for methane");
    const componentData = buildComponentData(methane, data, ["Name-Formula"]);
    const componentEq = buildComponentEquation(methane, methaneCp, data, ["Name-Formula"]);

    const modelSource: ModelSource = {
        dataSource: componentData,
        equationSource: componentEq
    };

    const source = new Source(modelSource, "Name-Formula");

    return { component: methane, modelSource, source };
}

function buildMatrixFixture() {
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

    const methanolRecords: RawThermoRecord[] = [
        { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
        { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
        { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
        { name: "State", symbol: "-", value: "l", unit: "N/A" },
        { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
        { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" },
        { name: "b_i_j_1", symbol: "b_i_j_1", value: 4, unit: "1" },
        { name: "b_i_j_2", symbol: "b_i_j_2", value: 5, unit: "1" }
    ];

    const ethanolRecords: RawThermoRecord[] = [
        { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
        { name: "Name", symbol: "-", value: "Ethanol", unit: "N/A" },
        { name: "Formula", symbol: "-", value: "C2H5OH", unit: "N/A" },
        { name: "State", symbol: "-", value: "l", unit: "N/A" },
        { name: "a_i_j_1", symbol: "a_i_j_1", value: 2, unit: "1" },
        { name: "a_i_j_2", symbol: "a_i_j_2", value: 3, unit: "1" },
        { name: "b_i_j_1", symbol: "b_i_j_1", value: 6, unit: "1" },
        { name: "b_i_j_2", symbol: "b_i_j_2", value: 7, unit: "1" }
    ];

    const matrixData: RawThermoRecord[][] = [methanolRecords, ethanolRecords];
    const source = new Source(undefined, "Name-Formula");
    const allBinaryMixtureData = buildBinaryMixtureData(mixture, matrixData);
    const nameFormulaMixtureId = "Methanol-CH3OH|Ethanol-C2H5OH";
    const binaryMixtureData =
        allBinaryMixtureData[nameFormulaMixtureId] ??
        Object.values(allBinaryMixtureData)[0] ??
        {};

    const matrixModelSource: ModelSource = {
        dataSource: binaryMixtureData,
        equationSource: {}
    };

    return {
        methanol,
        ethanol,
        mixture,
        matrixData,
        source,
        matrixModelSource
    };
}

describe("Core wrappers", () => {
    it("DataSourceCore builds component id and lists props", () => {
        const { component, source } = buildFixture();
        const ds = new DataSourceCore(component, source, "Name-Formula");

        expect(ds.componentId).toBe("Methane-CH4");
        expect(ds.props()).toEqual(expect.arrayContaining(["A", "B", "Tmin", "Tmax"]));
    });

    it("DataSourceCore.prop returns record or null", () => {
        const { component, source } = buildFixture();
        const ds = new DataSourceCore(component, source, "Name-Formula");

        expect(ds.prop("A")).toEqual({
            value: 33298,
            unit: "J/kmol*K",
            symbol: "A"
        });
        expect(ds.prop("Missing")).toBeNull();
    });

    it("EquationSourcesCore lists equations and creates EquationSourceCore", () => {
        const { component, source } = buildFixture();
        const eqs = new EquationSourcesCore(component, source, "Name-Formula");

        expect(eqs.equations()).toContain("Cp_IG");

        const eqCore = eqs.eq("Cp_IG");
        expect(eqCore).toBeInstanceOf(EquationSourceCore);
        expect(eqs.eq("MissingProp")).toBeNull();
    });

    it("EquationSourceCore exposes metadata and executes calc", () => {
        const { component, source } = buildFixture();
        const eqCore = new EquationSourceCore("Cp_IG", component, source, "Name-Formula");

        expect(eqCore.returnUnit).toBe("J/kmol*K");
        expect(eqCore.returnSymbol).toBe("Cp_IG");
        expect(eqCore.argSymbols).toContain("T");
        expect(eqCore.args.T.symbol).toBe("T");
        expect(eqCore.inputs.T.unit).toBe("K");

        const res = eqCore.calc({ T: 298.15 });
        expect(res).not.toBeNull();
        expect(res?.value).toBeGreaterThan(0);
        expect(res?.unit).toBe("J/kmol*K");
        expect(res?.symbol).toBe("Cp_IG");
    });

    it("EquationSourceCore.calc returns null when required args are missing", () => {
        const { component, source } = buildFixture();
        const eqCore = new EquationSourceCore("Cp_IG", component, source, "Name-Formula");

        expect(eqCore.calc()).toBeNull();
    });

    it("factory functions return wrappers for valid input", () => {
        const { component, modelSource } = buildFixture();

        expect(mkdt(component, modelSource, "Name-Formula")).toBeInstanceOf(DataSourceCore);
        expect(mkeqs(component, modelSource, "Name-Formula")).toBeInstanceOf(EquationSourcesCore);
        expect(mkeq("Cp_IG", component, modelSource, "Name-Formula")).toBeInstanceOf(EquationSourceCore);
    });

    it("factory functions return null for invalid or missing inputs", () => {
        const { component, modelSource } = buildFixture();

        expect(mkeq("", component, modelSource, "Name-Formula")).toBeNull();
        expect(
            mkdt(
                { formula: "CH4", state: "g" } as unknown as Component,
                modelSource,
                "Name-Formula"
            )
        ).toBeNull();
        expect(
            mkeqs(
                component,
                { dataSource: {} } as unknown as ModelSource,
                "Name-Formula"
            )
        ).toBeNull();
    });

    it("Source builds binary mixture source and resolves matrix source by property symbols", () => {
        const { mixture, matrixData, source } = buildMatrixFixture();
        const binarySource = source.buildBinaryMixtureSource(mixture, matrixData);

        expect(binarySource).not.toBeNull();
        expect(binarySource).toHaveProperty("Methanol|Ethanol");
        expect(binarySource).toHaveProperty("CH3OH|C2H5OH");
        expect(binarySource).toHaveProperty("Methanol-CH3OH|Ethanol-C2H5OH");
        expect(binarySource).toHaveProperty("Ethanol|Methanol");

        const symbols = source.getMixturePropertySymbols(binarySource!, "methanol|ethanol");
        expect(symbols).toEqual(expect.arrayContaining(["a", "b"]));

        const srcA = source.getMixturePropertySource(binarySource!, "methanol|ethanol", "a");
        const srcAIj = source.getMixturePropertySource(binarySource!, "methanol|ethanol", "a_i_j");
        const srcAComponents = source.getMixturePropertySource(binarySource!, "methanol|ethanol", "a_methanol_ethanol");

        expect(srcA).toBeInstanceOf(MoziMatrixData);
        expect(srcAIj).toBeInstanceOf(MoziMatrixData);
        expect(srcAComponents).toBeInstanceOf(MoziMatrixData);
    });

    it("MatrixDataSourceCore exposes mixture props and delegates matrix lookups", () => {
        const { methanol, ethanol, mixture, matrixModelSource } = buildMatrixFixture();
        const source = new Source(matrixModelSource, "Name-Formula");
        const matrixCore = new MatrixDataSourceCore(mixture, source, "Name-Formula");

        expect(matrixCore.mixtureIds()).toEqual(expect.arrayContaining(["methanol|ethanol"]));
        expect(matrixCore.props()).toEqual(expect.arrayContaining(["a", "b"]));
        expect(matrixCore.src("a_i_j")).toBeInstanceOf(MoziMatrixData);

        const row = matrixCore.row("a_i_j", methanol, "methanol|ethanol");
        expect(row).toEqual([0, 1]);

        const prop = matrixCore.prop("a_i_j", [methanol, ethanol], "methanol|ethanol");
        expect(prop).not.toBeNull();
        expect(prop?.value).toBe(1);
        expect(prop?.unit).toBe("1");

        const mat = matrixCore.mat("a_methanol_ethanol", [methanol, ethanol], "methanol|ethanol");
        expect(mat).toEqual([
            [0, 1],
            [2, 3]
        ]);

        const matDict = matrixCore.matDict("a_methanol_ethanol", [methanol, ethanol], "methanol|ethanol");
        expect(matDict).toBeTruthy();
        expect(matDict?.["Methanol-CH3OH_Methanol-CH3OH"]).toBe(0);

        const ij = matrixCore.ij("a_1_2", "methanol|ethanol");
        expect(ij?.value).toBe(1);

        const ijs = matrixCore.ijs("a|methanol|ethanol", "Name");
        expect(ijs).not.toBeNull();
        expect(ijs?.["Methanol_Methanol"]).toBe(0);
        expect(ijs?.["Methanol_Ethanol"]).toBe(1);
    });

    it("MatrixDataSourceCore returns null or empty for missing mixture/property", () => {
        const { methanol, mixture, matrixModelSource } = buildMatrixFixture();
        const source = new Source(matrixModelSource, "Name-Formula");
        const matrixCore = new MatrixDataSourceCore(mixture, source, "Name-Formula");

        expect(matrixCore.props("unknown|mixture")).toEqual(expect.arrayContaining(["a", "b"]));
        expect(matrixCore.src("missing_prop")).toBeNull();
        expect(matrixCore.row("missing_prop", methanol)).toBeNull();
        expect(matrixCore.prop("missing_prop", [methanol, methanol])).toBeNull();
    });

    it("mkmat returns a matrix wrapper for valid input and null for non-binary mixtures", () => {
        const { component, modelSource } = buildFixture();
        const { methanol, ethanol, mixture, matrixModelSource } = buildMatrixFixture();

        const valid = mkmat(mixture, matrixModelSource, "Name-Formula");
        expect(valid).toBeInstanceOf(MatrixDataSourceCore);
        expect(valid?.props()).toEqual(expect.arrayContaining(["a", "b"]));
        const mixtureId = valid?.mixtureIds()[0];
        expect(valid?.mat("a_methanol_ethanol", [methanol, ethanol], mixtureId)).toEqual([
            [0, 1],
            [2, 3]
        ]);

        const invalid = mkmat([methanol, ethanol, methanol], matrixModelSource, "Name-Formula");
        expect(invalid).toBeNull();

        const invalidDataShape = mkmat([component, component], modelSource, "Name-Formula");
        expect(invalidDataShape).toBeNull();
    });

    it("mkmat works when modelSource.dataSource contains both component and mixture entries", () => {
        const { component, modelSource } = buildFixture();
        const { methanol, ethanol, mixture, matrixModelSource } = buildMatrixFixture();

        const mixedDataSource = {
            ...(modelSource.dataSource as Record<string, unknown>),
            ...(matrixModelSource.dataSource as Record<string, unknown>)
        } as ModelSource["dataSource"];

        const mixedModelSource: ModelSource = {
            dataSource: mixedDataSource,
            equationSource: modelSource.equationSource
        };

        const mixed = mkmat(mixture, mixedModelSource, "Name-Formula");
        expect(mixed).toBeInstanceOf(MatrixDataSourceCore);
        expect(mixed?.props()).toEqual(expect.arrayContaining(["a", "b"]));

        const dsCore = mkdt(component, mixedModelSource, "Name-Formula");
        expect(dsCore).toBeInstanceOf(DataSourceCore);
        expect(dsCore?.prop("A")?.value).toBe(33298);
    });
});
