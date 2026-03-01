import { create_binary_mixture_id, set_component_id } from "mozithermodb-settings";
import type { Component, ComponentKey, BinaryMixtureKey } from "mozithermodb-settings";
import type { ModelSource } from "@/types/sources";
import type { BinaryMixtureData } from "@/docs/matrix-data";
import { MoziMatrixData } from "@/core";
import { Source } from "./source";
import { DataSourceCore } from "./datasource-core";
import { EquationSourceCore } from "./equationsource-core";
import { EquationSourcesCore } from "./equationsources-core";
import { MatrixDataSourceCore } from "./matrixdatasource-core";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object";

type MatrixSourceLike = {
    mat: (...args: unknown[]) => unknown;
    matDict: (...args: unknown[]) => unknown;
    ij: (...args: unknown[]) => unknown;
    getProperty: (...args: unknown[]) => unknown;
};

const isMatrixSourceLike = (value: unknown): value is MatrixSourceLike => {
    if (!value || typeof value !== "object") return false;
    const v = value as Partial<MatrixSourceLike>;
    return (
        typeof v.mat === "function" &&
        typeof v.matDict === "function" &&
        typeof v.ij === "function" &&
        typeof v.getProperty === "function"
    );
};

const isValidComponentLike = (value: unknown, componentKey: ComponentKey): value is Component => {
    if (!isRecord(value)) return false;

    if (typeof value.name !== "string" || value.name.length === 0) return false;
    if (typeof value.formula !== "string" || value.formula.length === 0) return false;

    if ((componentKey.includes("State")) && (typeof value.state !== "string" || value.state.length === 0)) {
        return false;
    }

    return true;
};

const isValidModelSourceLike = (value: unknown): value is ModelSource => {
    if (!isRecord(value)) return false;
    if (!("dataSource" in value) || !("equationSource" in value)) return false;
    return true;
};

const isBinaryMixtureDataLike = (value: unknown): value is BinaryMixtureData => {
    if (!isRecord(value)) return false;
    const entries = Object.values(value);
    if (entries.length === 0) return false;
    return entries.some(entry => entry instanceof MoziMatrixData || isMatrixSourceLike(entry));
};

const pickBinaryMixtureDataFromDataSource = (
    dataSource: ModelSource["dataSource"],
    components: Component[],
    mixtureKey: BinaryMixtureKey
): BinaryMixtureData | null => {
    if (!isRecord(dataSource)) return null;

    // Case 1: already flattened BinaryMixtureData at top level.
    if (isBinaryMixtureDataLike(dataSource)) {
        const direct: BinaryMixtureData = {};
        for (const [key, value] of Object.entries(dataSource)) {
            if (value instanceof MoziMatrixData || isMatrixSourceLike(value)) {
                direct[key] = value as MoziMatrixData;
            }
        }
        if (Object.keys(direct).length > 0) return direct;
    }

    // Case 2: nested map keyed by mixture-id aliases: Record<string, BinaryMixtureData>.
    const candidates = [
        create_binary_mixture_id(components[0], components[1], mixtureKey),
        create_binary_mixture_id(components[1], components[0], mixtureKey)
    ];

    const sourceEntries = Object.entries(dataSource);
    for (const candidate of candidates) {
        const matched = sourceEntries.find(([k]) => k.trim().toLowerCase() === candidate.trim().toLowerCase());
        if (!matched) continue;

        const nested = matched[1];
        if (!isRecord(nested)) continue;

        const nestedBinary: BinaryMixtureData = {};
        for (const [k, v] of Object.entries(nested)) {
            if (v instanceof MoziMatrixData || isMatrixSourceLike(v)) {
                nestedBinary[k] = v as MoziMatrixData;
            }
        }
        if (Object.keys(nestedBinary).length > 0) return nestedBinary;
    }

    // Case 3: fallback - first nested object that looks like BinaryMixtureData.
    for (const value of Object.values(dataSource)) {
        if (!isRecord(value)) continue;
        const nestedBinary: BinaryMixtureData = {};
        for (const [k, v] of Object.entries(value)) {
            if (v instanceof MoziMatrixData || isMatrixSourceLike(v)) {
                nestedBinary[k] = v as MoziMatrixData;
            }
        }
        if (Object.keys(nestedBinary).length > 0) return nestedBinary;
    }

    return null;
};

const isValidMixtureComponentLike = (
    value: unknown,
    mixtureKey: BinaryMixtureKey
): value is Component => {
    if (!isRecord(value)) return false;

    const hasName = typeof value.name === "string" && value.name.length > 0;
    const hasFormula = typeof value.formula === "string" && value.formula.length > 0;

    if (mixtureKey === "Name") return hasName;
    if (mixtureKey === "Formula") return hasFormula;

    // Name-Formula
    return hasName && hasFormula;
};

export const mkeqs = (
    component: Component,
    modelSource: ModelSource,
    componentKey: ComponentKey = "Name-Formula",
): EquationSourcesCore | null => {
    try {
        if (!isValidModelSourceLike(modelSource)) return null;
        if (!isValidComponentLike(component, componentKey)) return null;

        const source = new Source(modelSource, componentKey);
        return new EquationSourcesCore(component, source, componentKey);
    } catch {
        return null;
    }
};

export const mkeq = (
    name: string,
    component: Component,
    modelSource: ModelSource,
    componentKey: ComponentKey = "Name-Formula",
): EquationSourceCore | null => {
    try {
        if (!name || typeof name !== "string") return null;
        if (!isValidModelSourceLike(modelSource)) return null;
        if (!isValidComponentLike(component, componentKey)) return null;

        const source = new Source(modelSource, componentKey);
        const componentId = set_component_id(component, componentKey);
        if (!source.isPropEqAvailable(componentId, name)) return null;

        return new EquationSourceCore(name, component, source, componentKey);
    } catch {
        return null;
    }
};

export const mkdt = (
    component: Component,
    modelSource: ModelSource,
    componentKey: ComponentKey = "Name-Formula",
): DataSourceCore | null => {
    try {
        if (!isValidModelSourceLike(modelSource)) return null;
        if (!isValidComponentLike(component, componentKey)) return null;

        const source = new Source(modelSource, componentKey);
        return new DataSourceCore(component, source, componentKey);
    } catch {
        return null;
    }
};

export const mkmat = (
    components: Component[],
    modelSource: ModelSource,
    mixtureKey: BinaryMixtureKey = "Name-Formula",
): MatrixDataSourceCore | null => {
    try {
        const componentKey = mixtureKey as ComponentKey;

        if (!isValidModelSourceLike(modelSource)) return null;
        if (!Array.isArray(components) || components.length !== 2) return null;
        if (!components.every(component => isValidMixtureComponentLike(component, mixtureKey))) return null;
        const binaryMixtureData = pickBinaryMixtureDataFromDataSource(
            modelSource.dataSource,
            components,
            mixtureKey
        );
        if (!binaryMixtureData) return null;

        const normalizedDataSource = {
            ...(isRecord(modelSource.dataSource) ? modelSource.dataSource : {}),
            ...binaryMixtureData
        };

        const normalizedModelSource: ModelSource = {
            dataSource: normalizedDataSource as ModelSource["dataSource"],
            equationSource: modelSource.equationSource
        };

        const source = new Source(normalizedModelSource, componentKey);
        source.componentKey = componentKey;

        return new MatrixDataSourceCore(components, source, mixtureKey);
    } catch {
        // log
        console.error("Error creating MatrixDataSourceCore with components:", components, "and modelSource:", modelSource);
        return null;
    }
};
