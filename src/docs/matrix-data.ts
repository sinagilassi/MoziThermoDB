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
    mixture: Component[],
    data: RawThermoRecord[][],
    mixtureKeys: BinaryMixtureKey[] = ["Name", "Formula", "Name-Formula"],
): Record<string, BinaryMixtureData> => {
    // SECTION: Input validation
    // NOTE: binary components
    if (mixture.length !== 2) {
        throw new Error(`Expected exactly 2 components for binary mixture data, but got ${mixture.length}`);
    }
    // SECTION: Collect component data relevant for the mixture
    const {
        mixtureId,
        records
    } = extractBinaryMixtureData(mixture, data);

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

    // SECTION: return map keyed by mixture id
    // NOTE: create mixture ids
    const mixtureIds = mixtureKeys.map(key => create_binary_mixture_id(
        mixture[0],
        mixture[1],
        key
    ));

    // >> reverse
    const reverseMixtureIds = mixtureKeys.map(key => create_binary_mixture_id(
        mixture[1],
        mixture[0],
        key
    ));

    // merge mixture ids
    const allMixtureIds = [...mixtureIds, ...reverseMixtureIds];

    const res: Record<string, BinaryMixtureData> = {};

    allMixtureIds.forEach(id => {
        res[id] = binaryMixtureData;
    });

    // res
    return res;
}

/**
 * Builds a combined map of analyzed matrix data for multiple binary mixtures.
 *
 * Each entry in `mixtures` must contain exactly two components. For each
 * valid pair, the returned object is keyed by its generated mixture id, and
 * each value maps available property symbols to a `MoziMatrixData` instance.
 *
 * @param mixtures List of binary component pairs to process.
 * @param data Raw thermo records used to extract and analyze mixture data.
 * @returns A map keyed by binary mixture id.
 * @throws Error If any mixture does not contain exactly 2 components.
 */
export const buildBinaryMixturesData = (
    mixtures: Component[][],
    data: RawThermoRecord[][],
): Record<string, BinaryMixtureData> => {
    // NOTE: build data for each binary mixture and combine into a single map
    const allBinaryMixtureData: Record<string, BinaryMixtureData> = {};
    mixtures.forEach(mixture => {
        const binaryMixtureData = buildBinaryMixtureData(mixture, data);
        Object.assign(allBinaryMixtureData, binaryMixtureData);
    }
    );

    // return
    return allBinaryMixtureData;
}
