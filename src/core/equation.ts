// import libs
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq,
    ParamMap,
    ArgMap,
    RetMap
} from '@/types';
import { timeIt } from '@/utils';


export class MoziEquation {
    // SECTION: Attributes
    scaleOperation: 'multiply' | 'divide' = 'multiply';
    params: ParamMap = {};
    enableTiming = false;

    // NOTE: constructor
    constructor(
        public name: string,
        public description: string,
        public configParams: ConfigParamMap,
        public configArgs: ConfigArgMap,
        public configRet: ConfigRetMap,
        private equation: Eq
    ) { }

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

    get returnSymbolList() {
        return Object.values(this.configRet).map(ret => ret.symbol);
    }

    // SECTION: Set Equation Parameters
    private setParams(
        data: { name: string; symbol: string; value: number; unit: string }[],
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

    // SECTION: Evaluation Equation
    @timeIt({ label: 'MoziEquation.calc', enabledKey: 'enableTiming' })
    public calc(args: ArgMap) {
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

        // NOTE: evaluate the equation function with the current parameters and input arguments
        const result = this.equation(params, args);

        // NOTE: return the result of the equation evaluation
        return result;
    }

    // SECTION: Retrieve Equation
    configure(data: { name: string; symbol: string; value: number; unit: string }[]) {
        // NOTE: initialize the equation with the provided data
        this.params = this.setParams(data);

        // NOTE: return an object with the equation's name, description, and a function to evaluate it
        return {
            calc: (args: ArgMap) => this.calc(args)
        };
    }
}
