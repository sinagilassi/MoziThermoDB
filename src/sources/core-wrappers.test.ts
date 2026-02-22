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
import { mkeq, mkeqs, mkdt } from "@/sources/main";

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
});
