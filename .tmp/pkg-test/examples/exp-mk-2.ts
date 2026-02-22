import { mkeq } from "mozithermodb";
import { makeMultiLinearModelSource } from "./helpers";

const { methane, ethane, modelSource } = makeMultiLinearModelSource("Name-Formula");

const methaneEq = mkeq("Y", methane as any, modelSource as any, "Name-Formula");
const ethaneEq = mkeq("Y", ethane as any, modelSource as any, "Name-Formula");

console.log("methane Y @ 250 K:", methaneEq ? methaneEq.calc({ T: 250 }) : null);
console.log("methane Y @ 400 K:", methaneEq ? methaneEq.calc({ T: 400 }) : null);
console.log("ethane Y @ 250 K:", ethaneEq ? ethaneEq.calc({ T: 250 }) : null);

const missing = mkeq("Cp_IG", ethane as any, modelSource as any, "Name-Formula");
console.log("missing ethane Cp_IG:", missing);

