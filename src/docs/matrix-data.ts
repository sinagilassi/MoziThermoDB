import {
    type Component,
} from "mozithermodb-settings"

// ! LOCALS
import { type RawThermoRecord, type ThermoRecordMap } from "@/types";
import { MoziMatrixData, type ThermoMatrixRecordMap } from "@/core";


export const buildMatrixData = (
    data: RawThermoRecord[][],
    name?: string,
    description?: string,
): ThermoMatrixRecordMap => {
    // NOTE: create MoziMatrixData instance
    const moziMatrixData = new MoziMatrixData(
        data,
        name,
        description
    );

    // NOTE: return
    return moziMatrixData.getData();
}

