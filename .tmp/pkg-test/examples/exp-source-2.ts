import { Source, calcEq } from "mozithermodb";
import { makeMultiLinearModelSource, idNameState } from "./helpers";

const { methane, ethane, modelSource } = makeMultiLinearModelSource("Name-State");
const source = new Source(modelSource as any, "Name-State");

console.log("Data keys:", Object.keys(modelSource.dataSource));
console.log("Equation keys:", Object.keys(modelSource.equationSource));

for (const c of [methane, ethane]) {
  const componentId = idNameState(c);
  console.log("\nComponent:", componentId);
  console.log("Data A:", source.dataExtractor(componentId, "A"));
  console.log("Equation Y symbol:", source.eqExtractor(componentId, "Y")?.equationSymbol);
}

const eqSrc = source.eqBuilder([methane as any, ethane as any], "Y");
console.log("\nBuilt equation source keys:", eqSrc ? Object.keys(eqSrc) : null);

const execResult = source.execEq([methane as any, ethane as any], eqSrc as any, { T: 300 });
console.log("execEq([methane, ethane], T=300):", execResult);

if (eqSrc) {
  const methaneId = idNameState(methane);
  const direct = calcEq(eqSrc[methaneId], { T: 300 });
  console.log("calcEq (Methane-g):", direct);
}

