# Agent Guidance: Matrix-Shaped Data for Binary Mixtures

This guide defines how an agent should create and use matrix-shaped mixture data, based on:
- `examples/exp-5.ts`
- `examples/exp-5-1.ts`
- `examples/exp-5-2.ts`

## Goal

Create `RawThermoRecord[][]` datasets for binary mixtures so they can be consumed by:
- `MoziMatrixData` (single matrix source usage)
- `buildBinaryMixtureData` (one binary mixture)
- `buildBinaryMixturesData` (multiple binary mixtures)

## Required Data Contract

Each binary mixture must have exactly **2 record arrays** (one per component in the pair).

Each record array must include these metadata rows:
- `Mixture`
- `Name`
- `Formula`
- `State`

Each record array must include matrix property rows for every required property prefix (for example `a`, `b`, `c`, `alpha`) in this shape:
- `${prefix}_i_j_1`
- `${prefix}_i_j_2`

Example property row names:
- `a_i_j_1`, `a_i_j_2`
- `b_i_j_1`, `b_i_j_2`
- `c_i_j_1`, `c_i_j_2`
- `alpha_i_j_1`, `alpha_i_j_2`

## Canonical Formatting Rules

- Use consistent component identity with `ComponentSchema.parse(...)`.
- Prefer canonical mixture ID format: lowercase and pipe-delimited, e.g. `methanol|ethanol`.
- The system can normalize variants like `Methanol | Ethanol`, but agents should still output canonical values to avoid ambiguity.
- Ensure both directional rows exist for each mixture pair:
  - component 1 row (e.g. methanol in methanol|ethanol)
  - component 2 row (e.g. ethanol in methanol|ethanol)

## Authoring Pattern

1. Define components with `ComponentSchema.parse`.
2. Build one `RawThermoRecord[]` per component row in each mixture.
3. Combine rows into `const matrixData: RawThermoRecord[][] = [...]`.
4. Choose one access pattern:
   - Single source: `new MoziMatrixData(matrixData)` then `analyzeRawData()`
   - Single mixture map: `buildBinaryMixtureData(mixture, matrixData)`
   - Multiple mixtures map: `buildBinaryMixturesData(mixtures, matrixData)`

## Access Pattern Selection

- Use `exp-5.ts` style when you want direct, manual control on one `MoziMatrixData` instance.
- Use `exp-5-1.ts` style when you need lookup maps for one binary mixture and symbol-group access (`["a"]`, `["b"]`, etc.).
- Use `exp-5-2.ts` style when building a merged lookup for many binary mixtures.

## Query Conventions

Use these APIs after analysis/build:
- `getProperty("a_i_j", component, mixtureId)`
- `getMatrixProperty("a_i_j", [componentI, componentJ], mixtureId)`
- `ij("a_1_2", mixtureId)` or `ij("a_methanol_ethanol", mixtureId, "Name")`
- `ijs("a | methanol | ethanol", "Name")`
- `mat("a_i_j", [component1, component2])`
- `matDict("a_i_j", [component1, component2])`

## Critical Rule: `mat(...)` Depends on Component Array Order

For agents, this is a high-priority rule:
- Keep the same property symbol (for example `"a_ethanol_methanol"`).
- If you change only the component array order, you can get different matrix data/orientation.

Example:

```ts
const res14 = moziMatrixData.mat(
  "a_ethanol_methanol",
  [methanol, ethanol],
);
console.log(res14);

const res14_1 = moziMatrixData.mat(
  "a_ethanol_methanol",
  [ethanol, methanol],
);
console.log(res14_1);
```

Agent instruction:
- Do not assume `mat(...)` is order-invariant.
- Always pass components in the exact intended `i, j` context.
- If results look flipped/transposed, verify the component array order first.

## Agent Output Checklist

- Exactly 2 rows per binary mixture.
- `Mixture/Name/Formula/State` rows present in every row.
- Property rows present with `_1` and `_2` suffixes for each prefix.
- Mixture IDs are canonical (`name1|name2`) unless a legacy format is required.
- Data grouped as `RawThermoRecord[][]`.
- Chosen builder/access approach matches the use case (`exp-5`, `exp-5-1`, or `exp-5-2` style).
- `mat(...)` calls are validated with both component orders when order-sensitive behavior matters.

## Minimal Template

```ts
import { ComponentSchema, type Component } from "mozithermodb-settings";
import type { RawThermoRecord } from "../src/types";
import { buildBinaryMixturesData } from "../src";

const compA = ComponentSchema.parse({ name: "Methanol", formula: "CH3OH", state: "l" });
const compB = ComponentSchema.parse({ name: "Ethanol", formula: "C2H5OH", state: "l" });

const rowA: RawThermoRecord[] = [
  { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
  { name: "Name", symbol: "-", value: "Methanol", unit: "N/A" },
  { name: "Formula", symbol: "-", value: "CH3OH", unit: "N/A" },
  { name: "State", symbol: "-", value: "l", unit: "N/A" },
  { name: "a_i_j_1", symbol: "a_i_j_1", value: 0, unit: "1" },
  { name: "a_i_j_2", symbol: "a_i_j_2", value: 1, unit: "1" }
];

const rowB: RawThermoRecord[] = [
  { name: "Mixture", symbol: "-", value: "methanol|ethanol", unit: "N/A" },
  { name: "Name", symbol: "-", value: "Ethanol", unit: "N/A" },
  { name: "Formula", symbol: "-", value: "C2H5OH", unit: "N/A" },
  { name: "State", symbol: "-", value: "l", unit: "N/A" },
  { name: "a_i_j_1", symbol: "a_i_j_1", value: 2, unit: "1" },
  { name: "a_i_j_2", symbol: "a_i_j_2", value: 3, unit: "1" }
];

const matrixData: RawThermoRecord[][] = [rowA, rowB];
const mixtures: Component[][] = [[compA, compB]];
const data = buildBinaryMixturesData(mixtures, matrixData);
```
