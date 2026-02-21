// SECTION: Initialization Function
export type Structure = {
    name: string;
    symbol: string;
    unit: string;
    scale?: number; // Optional scaling factor for input parameters
}

// NOTE: Config map for function parameters, keyed by parameter name (e.g., "temperature", "pressure")
export type ConfigParamMap<K extends string = string> = Record<K, Structure>;
// NOTE: Config map for function arguments, keyed by argument name (e.g., "volume", "amount")
export type ConfigArgMap<K extends string = string> = Record<K, Structure>;
// NOTE: Config map for function return value
export type ConfigRetMap<K extends string = string> = Record<K, Structure>;

// SECTION: Core Function Types
// Per-item unit (can be any string like "g/mol", "K", "Pa", ...)
export type Quantity = {
    value: number;
    unit: string;
};

export type SymbolicQuantity = Quantity & {
    symbol: string;
};

export type InputParam = SymbolicQuantity & {
    scale?: number;
};

export type InputArg = SymbolicQuantity;

export type Ret = SymbolicQuantity;

// Maps with strong key typing (optional)
export type ParamMap<K extends string = string> = Record<K, InputParam>;
export type ArgMap<K extends string = string> = Record<K, InputArg>;
export type RetMap<K extends string = string> = Record<K, Ret>;

// NOTE: Function type for equations, with strong typing for parameter, argument, and return keys
export type Eq<
    PKeys extends string = string,
    AKeys extends string = string,
    RKeys extends string = string
> = (
    params: ParamMap<PKeys>,
    args: ArgMap<AKeys>
) => RetMap<RKeys>;
