// One-shot evaluation using launchEquation
// Ideal gas heat capacity (Cp) for methane using the provided coefficients.
// Formula:
// Y = A + B*(C/T / sinh(C/T))^2 + D*(E/T / cosh(E/T))^2
// Units: J/(kmol*K)

import { launchEq } from "../src/docs/equation";
import type { Eq, ConfigParamMap, ConfigArgMap, ConfigRetMap } from "../src/types";

type P = "A" | "B" | "C" | "D" | "E";
type A = "T";
type R = "Cp";

const params: ConfigParamMap<P> = {
    A: { name: "A", symbol: "A", unit: "J/kmol*K" },
    B: { name: "B", symbol: "B", unit: "J/kmol*K" },
    C: { name: "C", symbol: "C", unit: "K" },
    D: { name: "D", symbol: "D", unit: "J/kmol*K" },
    E: { name: "E", symbol: "E", unit: "K" }
};

const args: ConfigArgMap<A> = {
    T: { name: "Temperature", symbol: "T", unit: "K" }
};

const ret: ConfigRetMap<R> = {
    Cp: { name: "Heat Capacity (ideal gas)", symbol: "Cp", unit: "J/kmol*K" }
};

const eq: Eq<P, A, R> = (p, a) => {
    const T = a.T.value;
    const x = p.C.value / T;
    const y = p.E.value / T;
    const termB = (x / Math.sinh(x)) ** 2;
    const termD = (y / Math.cosh(y)) ** 2;
    const Cp = p.A.value + p.B.value * termB + p.D.value * termD;

    return {
        Cp: { value: Cp, unit: "J/kmol*K", symbol: "Cp" }
    };
};

const result = launchEq(
    params,
    args,
    ret,
    eq,
    [
        { name: "A", symbol: "A", value: 33298, unit: "J/kmol*K" },
        { name: "B", symbol: "B", value: 79933, unit: "J/kmol*K" },
        { name: "C", symbol: "C", value: 2086.9, unit: "K" },
        { name: "D", symbol: "D", value: 41602, unit: "J/kmol*K" },
        { name: "E", symbol: "E", value: 991.96, unit: "K" }
    ],
    {
        T: { value: 298.15, unit: "K", symbol: "T" }
    },
    "Methane Ideal Gas Cp",
    "Ideal gas heat capacity for methane",
);

console.log(result);
