import { mkdt, mkeq, mkeqs, Source } from "mozithermodb";
import { makeMultiLinearModelSource, idNameFormula } from "./helpers";

const { methane, ethane, modelSource } = makeMultiLinearModelSource("Name-Formula");

const source = new Source(modelSource as any, "Name-Formula");
const methaneId = idNameFormula(methane);
const ethaneId = idNameFormula(ethane);

console.log("source.isPropDataAvailable(methane, A):", source.isPropDataAvailable(methaneId, "A"));
console.log("source.isPropEqAvailable(ethane, Y):", source.isPropEqAvailable(ethaneId, "Y"));

const methaneData = mkdt(methane as any, modelSource as any, "Name-Formula");
console.log("mkdt methane props:", methaneData ? methaneData.props() : null);

const ethaneEqs = mkeqs(ethane as any, modelSource as any, "Name-Formula");
console.log("mkeqs ethane equations:", ethaneEqs ? ethaneEqs.equations() : null);

const methaneY = mkeq("Y", methane as any, modelSource as any, "Name-Formula");
const ethaneY = mkeq("Y", ethane as any, modelSource as any, "Name-Formula");

console.log("mkeq methane Y @ 300 K:", methaneY ? methaneY.calc({ T: 300 }) : null);
console.log("mkeq ethane Y @ 300 K:", ethaneY ? ethaneY.calc({ T: 300 }) : null);

