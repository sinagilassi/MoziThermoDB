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

export type Param = SymbolicQuantity & {
    scale?: number;
};

export type Arg = SymbolicQuantity;

export type Ret = SymbolicQuantity;

// Maps with strong key typing (optional)
export type ParamMap<K extends string = string> = Record<K, Param>;
export type ArgMap<K extends string = string> = Record<K, Arg>;
export type RetMap = Ret;

// NOTE: Function type for equations, with strong typing for parameter, argument, and return keys
export type Awaitable<T> = T | Promise<T>;

export type Eq<
    PKeys extends string = string,
    AKeys extends string = string
> = (
    params: ParamMap<PKeys>,
    args: ArgMap<AKeys>
) => Awaitable<RetMap>;
