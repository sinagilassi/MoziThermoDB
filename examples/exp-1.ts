// Ideal gas heat capacity (Cp) for methane using the provided coefficients.
// Formula:
// Y = A + B*(C/T / sinh(C/T))^2 + D*(E/T / cosh(E/T))^2
// Units: J/(kmol*K)

import type { Component } from "mozithermodb-settings";
import { ComponentSchema } from "mozithermodb-settings";
// ! LOCALS
import { createEq, buildEquation, Equation, buildComponentEquation } from "../src/docs/equation";
import type { Eq, ConfigParamMap, ConfigArgMap, ConfigRetMap, RawThermoRecord } from "../src/types";
import { assertRawThermoRecordMatchesComponent } from "../src/utils";

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

const methaneCp = createEq(
  params,
  args,
  ret,
  eq,
  "Methane Ideal Gas Cp",
  "Ideal gas heat capacity for methane",
);

const component = ComponentSchema.parse({
  name: "Methane",
  formula: "CH4",
  state: 'g'
});

// fake component id for this example (matches the data records for the component)
const componentFake = ComponentSchema.parse({
  name: "Octane",
  formula: "C8H18",
  state: 'g'
});

const componentId = "Methane-CH4";

// NOTE: database records for the equation (e.g. from attached data)
const data: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "Methane", unit: "" },
  { name: "Formula", symbol: "Formula", value: "CH4", unit: "" },
  { name: "State", symbol: "State", value: "g", unit: "" },
  { name: "A Constant", symbol: "A", value: 33298, unit: "J/kmol*K" },
  { name: "B Constant", symbol: "B", value: 79933, unit: "J/kmol*K" },
  { name: "C Constant", symbol: "C", value: 2086.9, unit: "K" },
  { name: "D Constant", symbol: "D", value: 41602, unit: "J/kmol*K" },
  { name: "E", symbol: "E", value: 991.96, unit: "K" },
  { name: "Tmin", symbol: "Tmin", value: 298.15, unit: "K" },
  { name: "Tmax", symbol: "Tmax", value: 1300, unit: "K" }
];

// Optional explicit guard: validate that raw data belongs to the selected component
assertRawThermoRecordMatchesComponent(component, data, "Name-Formula");

// Initialize with coefficient values (from attached data)
const Cp_eq_source: Equation = buildEquation(
  methaneCp,
  data,
);
console.log(Cp_eq_source);

const CH4_Cp_eq = Cp_eq_source.equation; // extract the equation for methane

// disable timing for this example
// componentEq.enableTiming = false;
// enable range checks (uses Tmin/Tmax from data)
CH4_Cp_eq.enableRangeCheck = true;

// Evaluate with argument values (in-range)
const resultInRange = CH4_Cp_eq.calc({
  T: { value: 298.15, unit: "K", symbol: "T" }
});

console.log(resultInRange);

// Example: out-of-range (will throw)
try {
  CH4_Cp_eq.calc({
    T: { value: 200, unit: "K", symbol: "T" }
  });
} catch (err) {
  console.log("Error (as expected for out-of-range):", err instanceof Error ? err.message : String(err));
}

// SECTION: Build Component Equation (maps to component id)
const componentEq = buildComponentEquation(
  component,
  methaneCp,
  data,
  ["Name-Formula", "Formula-State", "Name-State"], // component keys to generate multiple ids
  true, // enable component/data match guard
  "Name-Formula"
);

console.log(componentEq);

// NOTE: execute
const eq1 = componentEq["Methane-CH4"]["Cp_IG"];
const result = eq1.calc({
  T: { value: 298.15, unit: "K", symbol: "T" }
});

console.log(result);
