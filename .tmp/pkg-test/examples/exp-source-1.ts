import { Source, calcEq } from "mozithermodb";
import { makeSingleCpModelSource, idNameState } from "./helpers";

const { methane, modelSource } = makeSingleCpModelSource("Name-State");
const source = new Source(modelSource as any, "Name-State");
const componentId = idNameState(methane);

console.log("componentId:", componentId);
console.log("Record A:", source.dataExtractor(componentId, "A"));

const eqCp = source.eqExtractor(componentId, "Cp_IG");
console.log("Equation symbol:", eqCp && eqCp.equationSymbol);

const eqSrc = source.eqBuilder([methane as any], "Cp_IG");
console.log("Built equation source keys:", eqSrc ? Object.keys(eqSrc) : null);

const result = source.execEq([methane as any], eqSrc as any, { T: 298.15 });
console.log("execEq([methane], T=298.15):", result);

if (eqSrc && eqSrc[componentId]) {
  const direct = calcEq(eqSrc[componentId], { T: 298.15 });
  console.log("calcEq:", direct);
}

