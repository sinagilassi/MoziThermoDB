type ComponentLike = {
  name: string;
  formula: string;
  state: string;
};

type RecordEntry = {
  value: number;
  unit: string;
  symbol: string;
};

type ThermoRecordMap = Record<string, RecordEntry>;

type EqArgMap = Record<string, { value: number; unit: string; symbol: string }>;

type EqLike = {
  equationSymbol: string;
  configArguments: Record<string, { name: string; symbol: string; unit: string }>;
  configReturn: Record<string, { name: string; symbol: string; unit: string }>;
  argumentSymbolList: string[];
  returnSymbolList: string[];
  returnUnit: string;
  calc: (args: EqArgMap) => { value: number; unit: string; symbol: string };
};

type ModelSourceLike = {
  dataSource: Record<string, ThermoRecordMap>;
  equationSource: Record<string, Record<string, EqLike>>;
};

function component(name: string, formula: string, state: string): ComponentLike {
  return { name, formula, state };
}

function idNameState(c: ComponentLike): string {
  return `${c.name}-${c.state}`;
}

function idNameFormula(c: ComponentLike): string {
  return `${c.name}-${c.formula}`;
}

function rec(value: number, unit: string, symbol: string): RecordEntry {
  return { value, unit, symbol };
}

function methaneDataMap(): ThermoRecordMap {
  return {
    A: rec(33298, "J/kmol*K", "A"),
    B: rec(79933, "J/kmol*K", "B"),
    C: rec(2086.9, "K", "C"),
    D: rec(41602, "J/kmol*K", "D"),
    E: rec(991.96, "K", "E"),
    Tmin: rec(298.15, "K", "Tmin"),
    Tmax: rec(1300, "K", "Tmax"),
    R: rec(8314.462618, "J/kmol*K", "R"),
  };
}

function ethaneDataMap(): ThermoRecordMap {
  return {
    A: rec(2.0, "-", "A"),
    B: rec(0.02, "1/K", "B"),
    Tmin: rec(100, "K", "Tmin"),
    Tmax: rec(500, "K", "Tmax"),
  };
}

function methaneLinearDataMap(): ThermoRecordMap {
  return {
    A: rec(1.0, "-", "A"),
    B: rec(0.01, "1/K", "B"),
    Tmin: rec(100, "K", "Tmin"),
    Tmax: rec(500, "K", "Tmax"),
  };
}

function createLinearEquation(options: {
  A: number;
  B: number;
  symbol?: string;
  name?: string;
  unit?: string;
}): EqLike {
  const symbol = options.symbol ?? "Y";
  const name = options.name ?? "Linear Example";
  const unit = options.unit ?? "-";

  return {
    equationSymbol: symbol,
    configArguments: {
      T: { name: "Temperature", symbol: "T", unit: "K" },
    },
    configReturn: {
      [symbol]: { name, symbol, unit },
    },
    argumentSymbolList: ["T"],
    returnSymbolList: [symbol],
    returnUnit: unit,
    calc(args) {
      const T = args.T.value;
      const value = options.A + options.B * T;
      return { value, unit, symbol };
    },
  };
}

function createCpIgEquationFromData(dataMap: ThermoRecordMap): EqLike {
  return {
    equationSymbol: "Cp_IG",
    configArguments: {
      T: { name: "Temperature", symbol: "T", unit: "K" },
      R: { name: "Universal Gas Constant", symbol: "R", unit: "J/kmol*K" },
    },
    configReturn: {
      Cp_IG: {
        name: "Heat Capacity (ideal gas)",
        symbol: "Cp_IG",
        unit: "J/kmol*K",
      },
    },
    argumentSymbolList: ["T", "R"],
    returnSymbolList: ["Cp_IG"],
    returnUnit: "J/kmol*K",
    calc(args) {
      const T = args.T.value;
      const R = args.R.value;
      const A = dataMap.A.value;
      const B = dataMap.B.value;
      const C = dataMap.C.value;
      const D = dataMap.D.value;
      const E = dataMap.E.value;

      const x = C / T;
      const y = E / T;
      const termB = (x / Math.sinh(x)) ** 2;
      const termD = (y / Math.cosh(y)) ** 2;
      const value = (A + B * termB + D * termD) * R;

      return { value, unit: "J/kmol*K", symbol: "Cp_IG" };
    },
  };
}

function makeSingleCpModelSource(componentKey: "Name-State" | "Name-Formula"): {
  methane: ComponentLike;
  modelSource: ModelSourceLike;
} {
  const methane = component("Methane", "CH4", "g");
  const data = methaneDataMap();
  const eq = createCpIgEquationFromData(data);
  const id = componentKey === "Name-State" ? idNameState(methane) : idNameFormula(methane);

  return {
    methane,
    modelSource: {
      dataSource: {
        [id]: data,
      },
      equationSource: {
        [id]: {
          Cp_IG: eq,
        },
      },
    },
  };
}

function makeMultiLinearModelSource(componentKey: "Name-State" | "Name-Formula"): {
  methane: ComponentLike;
  ethane: ComponentLike;
  modelSource: ModelSourceLike;
} {
  const methane = component("Methane", "CH4", "g");
  const ethane = component("Ethane", "C2H6", "g");
  const methaneId = componentKey === "Name-State" ? idNameState(methane) : idNameFormula(methane);
  const ethaneId = componentKey === "Name-State" ? idNameState(ethane) : idNameFormula(ethane);

  return {
    methane,
    ethane,
    modelSource: {
      dataSource: {
        [methaneId]: methaneLinearDataMap(),
        [ethaneId]: ethaneDataMap(),
      },
      equationSource: {
        [methaneId]: {
          Y: createLinearEquation({ A: 1.0, B: 0.01, symbol: "Y", name: "Example Property" }),
        },
        [ethaneId]: {
          Y: createLinearEquation({ A: 2.0, B: 0.02, symbol: "Y", name: "Example Property" }),
        },
      },
    },
  };
}

export {
  component,
  idNameFormula,
  idNameState,
  makeSingleCpModelSource,
  makeMultiLinearModelSource,
};

