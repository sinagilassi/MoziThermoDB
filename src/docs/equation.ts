// import libs
import { MoziEquation } from "@/core";
import {
    ConfigParamMap,
    ConfigArgMap,
    ConfigRetMap,
    Eq
} from '@/types';


export const createEquation = function (
    name: string,
    description: string,
    configParams: ConfigParamMap,
    configArgs: ConfigArgMap,
    configRet: ConfigRetMap,
    equation: Eq
): MoziEquation {
    return new MoziEquation(
        name,
        description,
        configParams,
        configArgs,
        configRet,
        equation
    );
}