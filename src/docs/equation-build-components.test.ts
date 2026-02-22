import { describe, it, expect } from "vitest";
import type { Component } from "mozithermodb-settings";
import { createEq, buildComponentsEquation } from "@/docs/equation";
import type {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    RawThermoRecord,
    Eq
} from "@/types";

type P = "A" | "B";
type A = "T";
type R = "Y";

const params: ConfigParamMap<P> = {
    A: { name: "Intercept", symbol: "A", unit: "-" },
    B: { name: "Slope", symbol: "B", unit: "1/K" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    Y: { name: "Example Property", symbol: "Y", unit: "-" }
};

const linearEq: Eq<P, A> = (p, a) => ({
    value: p.A.value + p.B.value * a.T.value,
    unit: "-",
    symbol: "Y"
});

const methane = { name: "Methane", formula: "CH4", state: "g" } as Component;
const ethane = { name: "Ethane", formula: "C2H6", state: "g" } as Component;

const methaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Methane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Intercept", symbol: "A", value: 1.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.01, unit: "1/K" }
];

const ethaneData: RawThermoRecord[] = [
    { name: "Name", symbol: "Name", value: "Ethane", unit: "" },
    { name: "Formula", symbol: "Formula", value: "C2H6", unit: "" },
    { name: "State", symbol: "State", value: "g", unit: "" },
    { name: "Intercept", symbol: "A", value: 2.0, unit: "-" },
    { name: "Slope", symbol: "B", value: 0.02, unit: "1/K" }
];

describe("buildComponentsEquation", () => {
    it("builds and merges configured equations for multiple components", () => {
        const eqTemplate = createEq(params, args, ret, linearEq, "Linear Example");

        const res = buildComponentsEquation(
            [methane, ethane],
            eqTemplate,
            [methaneData, ethaneData],
            ["Name-Formula", "Name-State"],
            true,
            "Name-Formula"
        );

        expect(res["Methane-CH4"]?.Y).toBeDefined();
        expect(res["Ethane-C2H6"]?.Y).toBeDefined();
        expect(res["Methane-g"]?.Y).toBeDefined();
        expect(res["Ethane-g"]?.Y).toBeDefined();
    });

    it("uses each component's own data when configuring cloned equations", () => {
        const eqTemplate = createEq(params, args, ret, linearEq, "Linear Example");

        const res = buildComponentsEquation(
            [methane, ethane],
            eqTemplate,
            [methaneData, ethaneData],
            ["Name-Formula"],
            true,
            "Name-Formula"
        );

        const methaneEq = res["Methane-CH4"].Y;
        const ethaneEq = res["Ethane-C2H6"].Y;

        const methaneOut = methaneEq.calc({
            T: { value: 300, unit: "K", symbol: "T" }
        });

        const ethaneOut = ethaneEq.calc({
            T: { value: 300, unit: "K", symbol: "T" }
        });

        expect(methaneOut.value).toBeCloseTo(4); // 1 + 0.01*300
        expect(ethaneOut.value).toBeCloseTo(8); // 2 + 0.02*300
        expect(methaneOut.symbol).toBe("Y");
        expect(ethaneOut.symbol).toBe("Y");
    });

    it("throws if a component has no matching raw-data block", () => {
        const eqTemplate = createEq(params, args, ret, linearEq, "Linear Example");

        expect(() =>
            buildComponentsEquation(
                [methane, ethane],
                eqTemplate,
                [methaneData], // ethane missing
                ["Name-Formula"],
                true,
                "Name-Formula"
            )
        ).toThrow();
    });
});
