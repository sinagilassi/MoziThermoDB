"use strict";

const { mkeq } = require("mozithermodb");
const { makeMultiLinearModelSource } = require("./helpers");

// Example: mkeq wrapper with a simple property and argument overrides
const { methane, ethane, modelSource } = makeMultiLinearModelSource("Name-Formula");

const methaneEq = mkeq("Y", methane, modelSource, "Name-Formula");
const ethaneEq = mkeq("Y", ethane, modelSource, "Name-Formula");

console.log("methane Y @ 250 K:", methaneEq ? methaneEq.calc({ T: 250 }) : null);
console.log("methane Y @ 400 K:", methaneEq ? methaneEq.calc({ T: 400 }) : null);
console.log("ethane Y @ 250 K:", ethaneEq ? ethaneEq.calc({ T: 250 }) : null);

const missing = mkeq("Cp_IG", ethane, modelSource, "Name-Formula");
console.log("missing ethane Cp_IG:", missing);

