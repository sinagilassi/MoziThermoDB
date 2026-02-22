import { describe, it, expect } from "vitest";
import type { Component } from "mozithermodb-settings";
import { createEq, buildEquation, buildComponentEquation } from "@/docs/equation";
import { buildComponentData } from "@/docs/data";
import type { ConfigParamMap, ConfigArgMap, ConfigRetMap, ThermoRecord, Eq } from "@/types";
import { Source } from "@/sources/source";
import type { ModelSource } from "@/types/sources";

type P = "A" | "B" | "C" | "D" | "E";
type A = "T";
type R = "Cp_IG";

const params: ConfigParamMap<P> = {
    A: { name: "A constant", symbol: "A", unit: "J/kmol*K" },
    B: { name: "B constant", symbol: "B", unit: "J/kmol*K" },
    C: { name: "C constant", symbol: "C", unit: "K" },
    D: { name: "D constant", symbol: "D", unit: "J/kmol*K" },
    E: { name: "E constant", symbol: "E", unit: "K" }
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

function buildModelSource(): { component: Component; modelSource: ModelSource } {
    const methane = {
        name: "Methane",
        formula: "CH4",
        state: "g"
    } as Component;

    const methaneCp = createEq(params, args, ret, eq, "Methane Ideal Gas Cp", "Ideal gas heat capacity for methane");

    const componentData = buildComponentData(methane, data, ["Name-State"]);
    const componentEq = buildComponentEquation(methane, methaneCp, data, ["Name-State"]);

    const modelSource: ModelSource = {
        dataSource: componentData,
        equationSource: componentEq
    };

    return { component: methane, modelSource };
}

describe("Source", () => {
    it("extracts data and equations", () => {
        const { component, modelSource } = buildModelSource();
        const source = new Source(modelSource, "Name-State");

        const componentId = "Methane-g";

        const record = source.dataExtractor(componentId, "A");
        expect(record?.value).toBe(33298);

        const eqInstance = source.eqExtractor(componentId, "Cp_IG");
        expect(eqInstance?.equationSymbol).toBe("Cp_IG");
    });

    it("builds args with nulls for missing values", () => {
        const { modelSource } = buildModelSource();
        const source = new Source(modelSource, "Name-State");

        const componentId = "Methane-g";
        const requiredArgs = source.checkArgs(componentId, args);
        const built = source.buildArgs(componentId, requiredArgs, ["T"]);

        expect(built.T.value).toBeNull();
    });

    it("builds equation sources and executes", () => {
        const { component, modelSource } = buildModelSource();
        const source = new Source(modelSource, "Name-State");

        const eqSrc = source.eqBuilder([component], "Cp_IG");
        expect(eqSrc).not.toBeNull();

        const res = source.execEq([component], eqSrc!, { T: 298.15 });
        expect(res).not.toBeNull();
        expect(res![0][0]).toBeGreaterThan(0);
    });

    it("throws when args are missing on exec", () => {
        const { component, modelSource } = buildModelSource();
        const source = new Source(modelSource, "Name-State");

        const eqSrc = source.eqBuilder([component], "Cp_IG");
        expect(() => source.execEq([component], eqSrc!)).toThrow();
    });

    it("returns null if property is missing for any component", () => {
        const { component, modelSource } = buildModelSource();
        const source = new Source(modelSource, "Name-State");

        const eqSrc = source.eqBuilder([component], "MissingProp");
        expect(eqSrc).toBeNull();
    });
});
