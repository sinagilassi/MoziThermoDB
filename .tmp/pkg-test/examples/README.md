Package-level examples for `mozithermodb` (using `require("mozithermodb")`).

These examples use the exported `sources` API only and construct `modelSource` objects directly.
The current package root export does not expose the `docs/*` builders from the main repo examples.

Run from `.tmp/pkg-test`:

```bash
node examples/exp-source-1.js
node examples/exp-source-2.js
node examples/exp-mk-1.js
node examples/exp-mk-2.js
node examples/exp-mk-3.js
```

TypeScript versions are also included:

- `examples/helpers.ts`
- `examples/exp-source-1.ts`
- `examples/exp-source-2.ts`
- `examples/exp-mk-1.ts`
- `examples/exp-mk-2.ts`
- `examples/exp-mk-3.ts`

Run with `tsx` (for example, from the repo root where `tsx` is installed):

```bash
npx tsx .tmp/pkg-test/examples/exp-source-1.ts
```
