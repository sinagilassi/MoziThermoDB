"use strict";

const { mkdt, mkeq, mkeqs, Source } = require("mozithermodb");
const { makeMultiLinearModelSource, idNameFormula } = require("./helpers");

// Example: Combined wrapper/source usage for multiple components
const { methane, ethane, modelSource } = makeMultiLinearModelSource("Name-Formula");

const source = new Source(modelSource, "Name-Formula");
const methaneId = idNameFormula(methane);
const ethaneId = idNameFormula(ethane);

console.log("source.isPropDataAvailable(methane, A):", source.isPropDataAvailable(methaneId, "A"));
console.log("source.isPropEqAvailable(ethane, Y):", source.isPropEqAvailable(ethaneId, "Y"));

const methaneData = mkdt(methane, modelSource, "Name-Formula");
console.log("mkdt methane props:", methaneData ? methaneData.props() : null);

const ethaneEqs = mkeqs(ethane, modelSource, "Name-Formula");
console.log("mkeqs ethane equations:", ethaneEqs ? ethaneEqs.equations() : null);

const methaneY = mkeq("Y", methane, modelSource, "Name-Formula");
const ethaneY = mkeq("Y", ethane, modelSource, "Name-Formula");

console.log("mkeq methane Y @ 300 K:", methaneY ? methaneY.calc({ T: 300 }) : null);
console.log("mkeq ethane Y @ 300 K:", ethaneY ? ethaneY.calc({ T: 300 }) : null);

