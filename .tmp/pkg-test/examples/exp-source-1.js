"use strict";

const { Source, calcEq } = require("mozithermodb");
const { makeSingleCpModelSource, idNameState } = require("./helpers");

// Example: Using Source to extract data/equations and execute (package import)
const { methane, modelSource } = makeSingleCpModelSource("Name-State");
const source = new Source(modelSource, "Name-State");
const componentId = idNameState(methane);

console.log("componentId:", componentId);
console.log("Record A:", source.dataExtractor(componentId, "A"));

const eqCp = source.eqExtractor(componentId, "Cp_IG");
console.log("Equation symbol:", eqCp && eqCp.equationSymbol);

const eqSrc = source.eqBuilder([methane], "Cp_IG");
console.log("Built equation source keys:", eqSrc ? Object.keys(eqSrc) : null);

const result = source.execEq([methane], eqSrc, { T: 298.15 });
console.log("execEq([methane], T=298.15):", result);

if (eqSrc && eqSrc[componentId]) {
  const direct = calcEq(eqSrc[componentId], { T: 298.15 });
  console.log("calcEq:", direct);
}

