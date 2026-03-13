// import libs
import {
    Component,
    ComponentKey,
    BinaryMixtureKey,
    create_binary_mixture_id,
    set_component_id
} from "mozithermodb-settings";
// ! LOCALS
import { MoziMatObj, RawThermoRecord } from "./types";
import { createBinaryMixtureIdsData, createBinaryMixturePropData } from "./utils";

// SECTION: Build Matrix Row
export function buildBinaryMatrixRawThermoData(
    components: Component[],
    mixtureKey: BinaryMixtureKey,
    componentKey: ComponentKey,
    propData: Record<string, MoziMatObj>,
    mixtureDelimiter: string = "|",
    componentOrder: "12" | "21" = "12",
    propSuffixIds: string[] = ["i_j_1", "i_j_2"],
    propKeyDelimiter: string = "_",
    mixtureIdMode: "lowercase" | "uppercase" | "original" = "lowercase"
): Record<string, RawThermoRecord[]> {
    // SECTION: Input validation
    if (components.length !== 2) {
        throw new Error("Component array must contain exactly 2 components for binary mixtures.");
    }

    // SECTION: Preparation
    // NOTE: Build binary matrix data
    const binaryMatrixData: Record<string, RawThermoRecord[]> = {};

    // NOTE: Set component order
    if (componentOrder === "21") {
        components = [components[1], components[0]];
    }

    // NOTE: Get mixture id for the binary mixture
    const mixtureId = create_binary_mixture_id(
        components[0],
        components[1],
        mixtureKey,
        mixtureDelimiter
    );

    // SECTION: Build binary matrix data
    // NOTE: Create binary mixture ids data
    // >>> set to "Name-Formula" to match the mixture id format used in propData keys
    const binaryMixtureIdsData = createBinaryMixtureIdsData(components, mixtureId, 'Name-Formula', mixtureIdMode);

    // SECTION: Create binary mixture property data
    // init binary mixture prop data
    const binaryMixturePropData: Record<string, RawThermoRecord[]> = Object.fromEntries(
        components.map(component => [set_component_id(component, componentKey), []])
    )

    // iterate over prop data
    for (const [key, value] of Object.entries(propData)) {
        // NOTE: binary mixture prop data for a component
        const data = createBinaryMixturePropData(
            components,
            key,
            value,
            propSuffixIds,
            propKeyDelimiter,
            componentKey
        );

        // NOTE: merge binary mixture prop data into the main binary matrix data
        for (const [compKey, records] of Object.entries(data)) {
            binaryMixturePropData[compKey] = [
                ...(binaryMixturePropData[compKey] || []),
                ...records
            ];
        }
    }

    // SECTION: Merge binary mixture ids data and prop data into the final binary matrix data
    for (const compKey of Object.keys(binaryMixtureIdsData)) {
        binaryMatrixData[compKey] = [
            ...(binaryMixtureIdsData[compKey] || []),
            ...(binaryMixturePropData[compKey] || [])
        ];
    }

    // res
    return binaryMatrixData
}