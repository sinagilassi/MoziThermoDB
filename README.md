# MoziThermoDB

[![npm version](https://badge.fury.io/js/mozithermodb.svg)](https://badge.fury.io/js/mozithermodb)
[![npm downloads](https://img.shields.io/npm/dm/mozithermodb?color=brightgreen)](https://www.npmjs.com/package/mozithermodb)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🧪 Overview

`mozithermodb` is a thermodynamic-model runtime wrapper for working with:

- component-keyed thermo data (`dataSource`)
- component-keyed equations (`equationSource`)
- convenience wrappers for querying data and evaluating equations

It is designed to consume a prebuilt `modelSource` object and provide a clean API for:

- extracting component properties
- listing available equations
- evaluating equations with input variables

## ✨ What This Package Provides

### 📦 Published Runtime Exports (v1.0.0)

The current published package exports these root APIs:

- `Source`
- `DataSourceCore`
- `EquationSourceCore`
- `EquationSourcesCore`
- `mkdt`
- `mkeq`
- `mkeqs`
- `calcEq`
- source-related TypeScript types (`ModelSource`, `DataSource`, `EquationSource`, etc.)

### ⚠️ Export Note (Important)

The repository source includes additional modules (`core`, `utils`, `docs`) and examples that use them directly, but the published `v1.0.0` bundle currently exposes only the source-wrapper APIs listed above.

If you are writing code against npm, use the package root exports shown in this README.

## 🚀 Installation

### 📥 Install From npm

```bash
npm install mozithermodb
```

`mozithermodb-settings` is installed automatically as a dependency.

## 🧩 Core Concept: `ModelSource`

### 🗂️ Expected Shape

This package expects a `modelSource` object:

```ts
import type { ModelSource } from "mozithermodb";

const modelSource: ModelSource = {
  dataSource: {
    "Methane-CH4": {
      A: { value: 33298, unit: "J/kmol*K", symbol: "A" },
      B: { value: 79933, unit: "J/kmol*K", symbol: "B" },
      Tmin: { value: 298.15, unit: "K", symbol: "Tmin" },
      Tmax: { value: 1300, unit: "K", symbol: "Tmax" }
    }
  },
  equationSource: {
    // component-id -> property/equation name -> configured equation instance
  }
};
```

### 🪪 Component IDs

Component IDs are strings like:

- `Name-Formula` → `Methane-CH4`
- `Name-State` → `Methane-g`
- `Formula-State` → `CH4-g`

Your `dataSource` and `equationSource` must use the same component-key convention you pass into `Source` / `mkdt` / `mkeq` / `mkeqs`.

## ⚡ Quick Start

### 🔎 Use `Source` Directly

```ts
import { Source } from "mozithermodb";
import type { Component } from "mozithermodb-settings";
import type { ModelSource } from "mozithermodb";

const methane = {
  name: "Methane",
  formula: "CH4",
  state: "g"
} as Component;

const modelSource = {} as ModelSource; // provide your prebuilt data/equation sources

const source = new Source(modelSource, "Name-Formula");
const componentId = "Methane-CH4";

const aConst = source.dataExtractor(componentId, "A");
const hasCpEq = source.isPropEqAvailable(componentId, "Cp_IG");
const cpEq = source.eqExtractor(componentId, "Cp_IG");

console.log({ aConst, hasCpEq, eqSymbol: cpEq?.equationSymbol });
```

### 🧰 Use Convenience Wrappers (`mk*`)

```ts
import { mkdt, mkeq, mkeqs } from "mozithermodb";

const ds = mkdt(methane, modelSource, "Name-Formula");
console.log(ds?.props());
console.log(ds?.prop("A"));

const eqs = mkeqs(methane, modelSource, "Name-Formula");
console.log(eqs?.equations());

const cp = mkeq("Cp_IG", methane, modelSource, "Name-Formula");
const result = cp?.calc({ T: 298.15 });
console.log(result);
```

### 🧮 Use `calcEq` for a Prepared Equation Source

```ts
import { calcEq } from "mozithermodb";

// eqSrc is a ComponentEquationSource (for one component + one property)
const out = calcEq(eqSrc, { T: 298.15 });
console.log(out); // { value, unit } | null
```

## 📚 API Reference

### 🏗️ `Source`

Low-level wrapper around `dataSource` + `equationSource`.

#### 🔹 Constructor

```ts
new Source(modelSource, componentKey?)
```

#### 🔹 Data Methods

- `dataExtractor(componentId, propName)` -> `{ value, unit, symbol } | null`
- `componentDataExtractor(componentId)` -> `ThermoRecordMap | null`
- `isPropDataAvailable(componentId, propName)` -> `boolean`

#### 🔹 Equation Methods

- `eqExtractor(componentId, propName)` -> configured equation instance | `null`
- `componentEqExtractor(componentId)` -> component equation map | `null`
- `isPropEqAvailable(componentId, propName)` -> `boolean`

#### 🔹 Combined/Execution Methods

- `isPropAvailable(componentId, propName)` -> `boolean`
- `eqBuilder(components, propName)` -> prepared equation-source map | `null`
- `execEq(components, eqSrcComp, argsValues?)` -> tuple result | `null`
- `getComponentData(componentId, components)` -> merged component data/equation object | `null`

### 📄 `DataSourceCore`

Single-component data wrapper.

#### 🔹 Methods

- `props()` -> list available property symbols
- `prop(name)` -> `{ value, unit, symbol } | null`

### 🧠 `EquationSourceCore`

Single-component, single-equation wrapper.

#### 🔹 Useful Getters

- `inputs`
- `args`
- `argSymbols`
- `returns`
- `returnSymbols`
- `returnUnit`
- `returnSymbol`

#### 🔹 Method

- `calc(inputArgs?)` -> equation result (`RetMap`) or `null`

### 🧾 `EquationSourcesCore`

Single-component wrapper for multiple equations.

#### 🔹 Methods

- `equations()` -> list available equation/property names
- `eq(name)` -> `EquationSourceCore | null`

### 🏭 Factory Helpers

#### 🔹 `mkdt(component, modelSource, componentKey?)`

Returns `DataSourceCore | null`.

#### 🔹 `mkeqs(component, modelSource, componentKey?)`

Returns `EquationSourcesCore | null`.

#### 🔹 `mkeq(name, component, modelSource, componentKey?)`

Returns `EquationSourceCore | null`.

### ➗ `calcEq(eqSrc, vars, outputUnit?)`

Evaluates a prepared `ComponentEquationSource`.

#### 🔹 Notes

- merges provided `vars` with any prefilled `eqSrc.inputs`
- returns `null` on invalid/missing inputs or runtime failures
- `outputUnit` conversion is not implemented yet (must match current unit)

## 🛡️ Error / Return Behavior

### ↩️ Null-First Wrapper Style

Many wrapper APIs intentionally return `null` instead of throwing (for invalid input, missing property/equation, or execution failure), especially:

- `mkdt`, `mkeq`, `mkeqs`
- `calcEq`
- `Source` extractors/builders
- `EquationSourceCore.calc()`

This makes the package convenient for scripting and defensive pipelines.

## 🧪 Examples In This Repository

### 📁 Example Scripts

See the `examples/` folder for end-to-end usage patterns, including:

- `examples/exp-source-1.ts` (using `Source` + `calcEq`)
- `examples/exp-mk-1.ts` (using `mkdt` / `mkeq` / `mkeqs`)
- `examples/exp-tools-1.ts` (raw thermo record utilities, repo source)

## 📄 License

Licensed under the Apache-2.0 License. See `LICENSE`.

## ❓ FAQ

For questions, contact Sina Gilassi on [LinkedIn](https://www.linkedin.com/in/sina-gilassi/).

## 👨‍💻 Author

- [@sinagilassi](https://github.com/sinagilassi)
