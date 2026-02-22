"use strict";

const { mkdt, mkeq, mkeqs } = require("mozithermodb");
const { makeSingleCpModelSource } = require("./helpers");

// Example: Python-style factory wrappers (mkdt, mkeqs, mkeq)
const { methane, modelSource } = makeSingleCpModelSource("Name-Formula");

const ds = mkdt(methane, modelSource, "Name-Formula");
console.log("mkdt props (first 8):", ds ? ds.props().slice(0, 8) : null);
console.log("mkdt prop(A):", ds ? ds.prop("A") : null);

const eqs = mkeqs(methane, modelSource, "Name-Formula");
console.log("mkeqs equations:", eqs ? eqs.equations() : null);

const eqFromList = eqs ? eqs.eq("Cp_IG") : null;
console.log("eqs.eq('Cp_IG') metadata:", eqFromList ? {
  returnUnit: eqFromList.returnUnit,
  returnSymbol: eqFromList.returnSymbol,
  argSymbols: eqFromList.argSymbols,
} : null);
console.log("eqs.eq('Cp_IG').calc:", eqFromList ? eqFromList.calc({ T: 298.15 }) : null);

const eqCore = mkeq("Cp_IG", methane, modelSource, "Name-Formula");
console.log("mkeq calc(T=400):", eqCore ? eqCore.calc({ T: 400 }) : null);

const missing = mkeq("MissingProp", methane, modelSource, "Name-Formula");
console.log("mkeq missing:", missing);

