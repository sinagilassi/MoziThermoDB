// import libs
// ! LOCALS
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq,
    ParamMap,
    ArgMap,
    RetMap,
    ThermoRecord
} from '@/types';
import { timeIt } from '@/utils';


export class MoziEquation {
    // SECTION: Attributes
    name: string = 'Thermo Equation';
    description: string = 'A thermodynamic equation with configurable parameters and arguments';

    // NOTE: scaling options for parameters (e.g., if input data is in different units than expected)
    scaleOperation: 'multiply' | 'divide' = 'multiply';
    params: ParamMap = {};

    // NOTE: timing options
    enableTiming = false;
    // NOTE: range check options
    enableRangeCheck = true;
    private argRanges: Record<string, { min?: number; max?: number; unit?: string }> = {};

    // NOTE: constructor
    constructor(
        public equationSymbol: string,
        public configParams: ConfigParamMap,
        public configArgs: ConfigArgMap,
        public configRet: ConfigRetMap,
        private equation: Eq,
        name?: string,
        description?: string
    ) {
        // set name and description if provided
        if (name) this.name = name;
        if (description) this.description = description;
    }

    // NOTE: Config Parameters
    get configParameters() {
        return this.configParams;
    }

    // NOTE: Config Arguments
    get configArguments() {
        return this.configArgs;
    }

    // NOTE: Config Return Value
    get configReturn() {
        return this.configRet;
    }

    // NOTE: parameter lists
    get parameterList() {
        return Object.keys(this.configParams);
    }

    get parameterSymbolList() {
        return Object.values(this.configParams).map(param => param.symbol);
    }

    // NOTE: argument lists
    get argumentList() {
        return Object.keys(this.configArgs);
    }

    get argumentSymbolList() {
        return Object.values(this.configArgs).map(arg => arg.symbol);
    }

    // NOTE: return value lists
    get returnList() {
        return Object.keys(this.configRet);
    }

    get returnUnit() {
        const res_ = Object.values(this.configRet).map(ret => ret.unit);

        // NOTE: assumes single return value for now
        if (res_.length !== 1) {
            throw new Error('Multiple return values found. Please provide a single return value for createEq.');
        }

        return res_[0];
    }

    get returnSymbolList() {
        return Object.values(this.configRet).map(ret => ret.symbol);
    }

    // SECTION: Set Equation Parameters
    private setParams(
        data: ThermoRecord[],
    ) {
        // NOTE: reset parameters
        const params: ParamMap = {};

        // NOTE: iterate through config parameters and match with input data
        for (const [key, value] of Object.entries(this.configParams)) {
            const dataItem = data.find(item => item.symbol === value.symbol);
            if (!dataItem) {
                throw new Error(`Missing data for parameter: ${value.name} (${value.symbol})`);
            }

            // NOTE: apply scaling if specified
            if (value.scale) {
                if (this.scaleOperation === 'multiply') {
                    dataItem.value *= value.scale;
                } else if (this.scaleOperation === 'divide') {
                    dataItem.value /= value.scale;
                }
            }

            // NOTE: store the parameter with its value, unit, symbol, and scale
            params[key] = {
                value: dataItem.value,
                unit: value.unit,
                symbol: value.symbol,
                scale: value.scale
            };
        }

        // res
        return params;
    }

    // SECTION: Extract Min/Max Ranges from data (e.g., Tmin/Tmax)
    private extractRanges(
        data: ThermoRecord[],
    ) {
        const argSymbols = this.argumentSymbolList;

        const argRanges: Record<string, { min?: number; max?: number; unit?: string }> = {};

        for (const item of data) {
            if (item.symbol.endsWith('min')) {
                const base = item.symbol.slice(0, -3);
                if (argSymbols.includes(base)) {
                    argRanges[base] = { ...(argRanges[base] ?? {}), min: item.value, unit: item.unit };
                }
            }

            if (item.symbol.endsWith('max')) {
                const base = item.symbol.slice(0, -3);
                if (argSymbols.includes(base)) {
                    argRanges[base] = { ...(argRanges[base] ?? {}), max: item.value, unit: item.unit };
                }
            }
        }

        this.argRanges = argRanges;
    }

    // SECTION: Range Checks
    private assertInRange(symbol: string, value: number, range?: { min?: number; max?: number; unit?: string }) {
        if (!range) return;

        if (range.min !== undefined && value < range.min) {
            throw new Error(`Value for ${symbol} (${value}) is below min (${range.min})${range.unit ? ` ${range.unit}` : ''}`);
        }

        if (range.max !== undefined && value > range.max) {
            throw new Error(`Value for ${symbol} (${value}) is above max (${range.max})${range.unit ? ` ${range.unit}` : ''}`);
        }
    }

    // SECTION: Evaluation Equation
    @timeIt({ label: 'MoziEquation.calc', enabledKey: 'enableTiming' })
    public calc(args: ArgMap): RetMap {
        // NOTE: parameter setup
        const params = this.params;

        // NOTE: argument setup
        // ! check symbol by symbol in configArgs and args to ensure correct mapping
        const argsSymbols = Object.values(args).map(arg => arg.symbol);

        // iterate through config arguments and match with input args
        for (const symbol of this.argumentSymbolList) {
            if (!argsSymbols.includes(symbol)) {
                throw new Error(`Missing argument for symbol: ${symbol}`);
            }
        }

        if (this.enableRangeCheck) {
            // check argument ranges (if provided)
            for (const [key, arg] of Object.entries(args)) {
                const symbol = arg.symbol ?? key;
                this.assertInRange(symbol, arg.value, this.argRanges[symbol]);
            }
        }

        // NOTE: evaluate the equation function with the current parameters and input arguments
        const result = this.equation(params, args);
        if (result && typeof (result as Promise<RetMap>).then === 'function') {
            throw new Error('Equation returned a Promise. Use calcAsync instead.');
        }

        // NOTE: return the result of the equation evaluation
        return result as RetMap;
    }

    // SECTION: Evaluation Equation (Async)
    @timeIt({ label: 'MoziEquation.calcAsync', enabledKey: 'enableTiming' })
    public async calcAsync(args: ArgMap): Promise<RetMap> {
        // NOTE: parameter setup
        const params = this.params;

        // NOTE: argument setup
        // ! check symbol by symbol in configArgs and args to ensure correct mapping
        const argsSymbols = Object.values(args).map(arg => arg.symbol);

        // iterate through config arguments and match with input args
        for (const symbol of this.argumentSymbolList) {
            if (!argsSymbols.includes(symbol)) {
                throw new Error(`Missing argument for symbol: ${symbol}`);
            }
        }

        if (this.enableRangeCheck) {
            // check argument ranges (if provided)
            for (const [key, arg] of Object.entries(args)) {
                const symbol = arg.symbol ?? key;
                this.assertInRange(symbol, arg.value, this.argRanges[symbol]);
            }
        }

        // NOTE: evaluate the equation function with the current parameters and input arguments
        const result = await this.equation(params, args);

        // NOTE: return the result of the equation evaluation
        return result;
    }

    // SECTION: Retrieve Equation
    configure(data: ThermoRecord[]) {
        // NOTE: initialize the equation with the provided data
        this.params = this.setParams(data);
        this.extractRanges(data);

        // NOTE: return an object with the equation's name, description, and a function to evaluate it
        return {
            calc: (args: ArgMap) => this.calc(args),
            calcAsync: (args: ArgMap) => this.calcAsync(args)
        };
    }
}
