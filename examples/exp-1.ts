// Ideal gas heat capacity (Cp) for methane using the provided coefficients.
// Formula:
// Y = A + B*(C/T / sinh(C/T))^2 + D*(E/T / cosh(E/T))^2
// Units: J/(kmol*K)

import { createEq, buildComponentEquation } from "../src/docs/equation";
import type { Eq, ConfigParamMap, ConfigArgMap, ConfigRetMap } from "../src/types";
import type { Component } from "mozithermodb-settings";

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
  Cp_IG: { name: "Heat Capacity (ideal gas)", symbol: "Cp", unit: "J/kmol*K" }
};

const eq: Eq<P, A, R> = (p, a) => {
  const T = a.T.value;
  const x = p.C.value / T;
  const y = p.E.value / T;
  const termB = (x / Math.sinh(x)) ** 2;
  const termD = (y / Math.cosh(y)) ** 2;
  const res = p.A.value + p.B.value * termB + p.D.value * termD;

  return {
    Cp_IG: { value: res, unit: "J/kmol*K", symbol: "Cp_IG" }
  };
};

const methaneCp = createEq(
  params,
  args,
  ret,
  eq,
  "Methane Ideal Gas Cp",
  "Ideal gas heat capacity for methane",
);

const component = {
  name: "Methane",
  formula: "CH4",
  state: 'g'
} as Component;

const componentId = "Methane-CH4";

// Initialize with coefficient values (from attached data)
const configured = buildComponentEquation(
  component,
  methaneCp, [
  { name: "A Constant", symbol: "A", value: 33298, unit: "J/kmol*K" },
  { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
  { name: "C Constant", symbol: "C", value: 2086.9, unit: "K" },
  { name: "D Constant", symbol: "D", value: 41602, unit: "J/kmol*K" },
  { name: "E", symbol: "E", value: 991.96, unit: "K" },
  { name: "Tmin", symbol: "Tmin", value: 298.15, unit: "K" },
  { name: "Tmax", symbol: "Tmax", value: 1300, unit: "K" }
],
  "Name-Formula"
);
console.log(configured);

const componentEq = configured[componentId];
// disable timing for this example
// componentEq.enableTiming = false;
// enable range checks (uses Tmin/Tmax from data)
componentEq.enableRangeCheck = true;

// Evaluate with argument values (in-range)
const resultInRange = componentEq.calc({
  T: { value: 298.15, unit: "K", symbol: "T" }
});

console.log(resultInRange);

// Example: out-of-range (will throw)
try {
  componentEq.calc({
    T: { value: 200, unit: "K", symbol: "T" }
  });
} catch (err) {
  console.log("Error (as expected for out-of-range):", err instanceof Error ? err.message : String(err));
}
