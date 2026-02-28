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



/**
 * Builds and analyzes matrix data from raw thermo records.
 *
 * Purpose
 * - Create a matrix-data container from raw thermo tables.
 * - Run the internal analysis pipeline before exposing results.
 * - Return a ready-to-use thermo matrix map for downstream lookups.
 *
 * Notes
 * - Input shape is a 2D record list (`RawThermoRecord[][]`) where each inner array
 *   represents one grouped raw dataset.
 * - Analysis is executed eagerly via `analyzeRawData()` before returning.
 * - The returned value comes from `MoziMatrixData.getData()` and is suitable for
 *   matrix-based property access workflows.
 *
 * @param data Raw thermo records to analyze.
 * @param name Optional dataset name.
 * @param description Optional dataset description.
 * @returns An analyzed thermo matrix record map.
 */
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

/**
 * Builds analyzed matrix data for a single binary mixture.
 *
 * Purpose
 * - Extract raw records relevant to one binary pair.
 * - Analyze matrix data once for that pair.
 * - Expose the same analyzed matrix object under multiple mixture-id aliases.
 *
 * Notes
 * - Only binary mixtures are supported (`mixture.length === 2`).
 * - Property symbols available for the pair are discovered from the analyzed matrix.
 * - Both forward and reverse ids are generated from `mixtureKeys`
 *   (e.g. A-B and B-A variants).
 * - Each id points to the same property-symbol map for consistent alias behavior.
 *
 * @param mixture A binary mixture containing exactly two components.
 * @param data Raw thermo records used for extracting mixture-specific data.
 * @param mixtureKeys ID formats used to generate mixture keys.
 * @returns A map keyed by binary mixture id.
 * @throws Error If `mixture` does not contain exactly 2 components.
 */
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
 * Purpose
 * - Iterate through multiple binary component pairs.
 * - Build per-mixture analyzed maps using `buildBinaryMixtureData`.
 * - Merge all generated ids into one lookup object.
 *
 * Notes
 * - Every item in `mixtures` must contain exactly two components.
 * - The final map may contain multiple aliases for the same physical pair,
 *   depending on `mixtureKeys` generation behavior in the single-mixture builder.
 * - Later merges follow object assignment semantics when keys overlap.
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
