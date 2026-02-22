// Liquid vapor pressure correlation (DIPPR Eq. 101)
// Y = exp(A + B/T + C*ln(T) + D*T^E)
// Units: T in K, Y in Pa

import { createEq, buildComponentEquation } from "../src/docs/equation";
import type { Eq, ConfigParamMap, ConfigArgMap, ConfigRetMap } from "../src/types";
import type { Component } from "mozithermodb-settings";

type P = "A" | "B" | "C" | "D" | "E";
type A = "T";
type R = "VaPr";

const params: ConfigParamMap<P> = {
    A: { name: "A", symbol: "A", unit: "-" },
    B: { name: "B", symbol: "B", unit: "K" },
    C: { name: "C", symbol: "C", unit: "-" },
    D: { name: "D", symbol: "D", unit: "1/K^E" },
    E: { name: "E", symbol: "E", unit: "-" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    VaPr: { name: "Vapor Pressure", symbol: "VaPr", unit: "Pa" }
};

const eq: Eq<P, A, R> = (p, a) => {
    const T = a.T.value;
    const lnY = p.A.value + p.B.value / T + p.C.value * Math.log(T) + p.D.value * T ** p.E.value;
    const Pvap = Math.exp(lnY);

    return {
        VaPr: { value: Pvap, unit: "Pa", symbol: "VaPr" }
    };
};

const vaporPressure = createEq(
    "Liquid Vapor Pressure (DIPPR 101)",
    "DIPPR Eq. 101 using K and Pa",
    params,
    args,
    ret,
    eq
);

const component = {
    name: "Methane",
    formula: "CH4",
    state: "l"
} as Component;

const componentId = "Methane-CH4";

// Initialize with coefficient values (from attached data)
const configured = buildComponentEquation(
    component,
    vaporPressure,
    [
        { name: "A constant", symbol: "A", value: 39.205, unit: "-" },
        { name: "B constant", symbol: "B", value: -1324.4, unit: "K" },
        { name: "C constant", symbol: "C", value: -3.4366, unit: "-" },
        { name: "D constant", symbol: "D", value: 3.1019e-5, unit: "1/K^E" },
        { name: "E constant", symbol: "E", value: 2, unit: "-" }
    ],
    "Name-Formula"
);

const componentEq = configured[componentId];

// Disable timing if desired
componentEq.enableTiming = true;

// Evaluate at temperature (K)
const result = componentEq.calc({
    T: { value: 298.15, unit: "K", symbol: "T" }
});

console.log(result);
