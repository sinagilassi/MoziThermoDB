import {
    type BinaryMixtureKey,
    type Component,
    create_binary_mixture_id
} from "mozithermodb-settings"

// ! LOCALS
import { type RawThermoRecord, type ThermoRecordMap } from "@/types";
import { MoziMatrixData, type ThermoMatrixRecordMap } from "@/core";
import {
    extractBinaryMixtureData
} from '@/utils';

// SECTION: Types
export type BinaryMixtureData = {
    [key: string]: MoziMatrixData
}



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

    // NOTE: analyze the data
    moziMatrixData.analyzeRawData();

    // NOTE: return
    return moziMatrixData.getData();
}

export const buildBinaryMixtureData = (
    components: Component[],
    data: RawThermoRecord[][],
): Record<string, BinaryMixtureData> => {
    // SECTION: Input validation
    // NOTE: binary components
    if (components.length !== 2) {
        throw new Error(`Expected exactly 2 components for binary mixture data, but got ${components.length}`);
    }
    // SECTION: Collect component data relevant for the mixture
    const {
        mixtureId,
        mixtureIds,
        mixtureKey,
        mixtureDelimiter,
        records
    } = extractBinaryMixtureData(components, data);

    // SECTION: Build the matrix data
    // NOTE: create MoziMatrixData instance
    const moziMatrixData = new MoziMatrixData(records);

    // >> set the mixture id for the components
    moziMatrixData.componentsMixtureId = mixtureId;

    // >> analyze the data
    moziMatrixData.analyzeRawData();

    // NOTE: get the property symbols available for this mixture
    // available properties
    const properties = moziMatrixData.getMixturePropertySymbols(mixtureId);

    // looping over properties to build a data map for this mixture
    const binaryMixtureData: BinaryMixtureData = {};

    properties.forEach(propertySymbol => {
        // assign
        Object.assign(binaryMixtureData, {
            [propertySymbol]: moziMatrixData
        })
    });

    // NOTE: return map keyed by mixture id
    const res: Record<string, BinaryMixtureData> = {};
    res[mixtureId] = binaryMixtureData;

    // res
    return res;
}