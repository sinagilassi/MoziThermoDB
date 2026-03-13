// import libs

// ! LOCALS
import { ComponentDataMap } from "@/docs/data";
import { ComponentEquationMap } from "@/docs/equation";
import { BinaryMixtureDataMap } from "@/docs/matrix-data";
import { DataSource, ModelSource } from "./types";

// SECTION: Build model source
export function buildModelSource(
    componentData: ComponentDataMap,
    componentEquation: ComponentEquationMap,
    binaryMixtureData: BinaryMixtureDataMap
): ModelSource {
    // Combine component data and binary mixture data into a single data source
    const dataSource: DataSource = {
        ...componentData,
        ...binaryMixtureData,
    };

    // NOTE: equation source
    const equationSource: ComponentEquationMap = componentEquation;

    // NOTE: model source
    const modelSource: ModelSource = {
        dataSource,
        equationSource,
    };

    return modelSource
}

