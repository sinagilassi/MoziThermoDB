import {
    type Component,
    type ComponentKey,
    type BinaryMixtureKey,
    type CustomProperty,
    create_binary_mixture_id
} from "mozithermodb-settings";
import type { BinaryMixtureData, BinaryMixtureDataMap } from "@/docs/matrix-data";
import { MoziMatrixData } from "@/core";
import { Source } from "./source";

export class MatrixDataSourceCore {
    public components: Component[];
    public source: Source;
    public mixtureKey: BinaryMixtureKey;
    public componentKey: ComponentKey;
    public binaryMixtureData: BinaryMixtureData;
    public forwardMixtureId: string;
    public reverseMixtureId: string;
    public defaultMixtureId: string | null;

    constructor(
        components: Component[],
        source: Source,
        mixtureKey: BinaryMixtureKey = "Name-Formula",
    ) {
        this.components = components;
        this.source = source;
        this.mixtureKey = mixtureKey;
        this.componentKey = mixtureKey as ComponentKey;
        this.source.componentKey = this.componentKey;

        this.forwardMixtureId = this.components.length === 2
            ? create_binary_mixture_id(this.components[0], this.components[1], this.mixtureKey)
            : "";
        this.reverseMixtureId = this.components.length === 2
            ? create_binary_mixture_id(this.components[1], this.components[0], this.mixtureKey)
            : "";

        this.binaryMixtureData = this.resolveBinaryMixtureData();
        this.defaultMixtureId = this.resolveDefaultMixtureId();
    }

    private resolveBinaryMixtureData(): BinaryMixtureData {
        const dataSource = this.source.datasource;
        if (!dataSource || typeof dataSource !== "object") return {};

        const isMatrixLike = (value: unknown): value is MoziMatrixData =>
            value instanceof MoziMatrixData ||
            (
                !!value &&
                typeof value === "object" &&
                typeof (value as { mat?: unknown }).mat === "function" &&
                typeof (value as { matDict?: unknown }).matDict === "function" &&
                typeof (value as { ij?: unknown }).ij === "function" &&
                typeof (value as { getProperty?: unknown }).getProperty === "function"
            );

        const isBinaryMixtureDataLike = (value: unknown): value is BinaryMixtureData => {
            if (!value || typeof value !== "object") return false;
            const entries = Object.values(value as Record<string, unknown>);
            if (entries.length === 0) return false;
            return entries.some(entry => isMatrixLike(entry));
        };

        const sourceObject = dataSource as Record<string, unknown>;

        // Case 1: datasource is already flattened BinaryMixtureData.
        if (isBinaryMixtureDataLike(sourceObject)) {
            const direct: BinaryMixtureData = {};
            for (const [key, value] of Object.entries(sourceObject)) {
                if (isMatrixLike(value)) {
                    direct[key] = value as MoziMatrixData;
                }
            }
            if (Object.keys(direct).length > 0) return direct;
        }

        // Case 2: datasource is BinaryMixtureDataMap keyed by mixture id.
        const map = sourceObject as BinaryMixtureDataMap;
        const candidates = [this.forwardMixtureId, this.reverseMixtureId]
            .filter(id => typeof id === "string" && id.length > 0);

        for (const candidate of candidates) {
            const matchedKey = Object.keys(map).find(k => k.trim().toLowerCase() === candidate.trim().toLowerCase());
            if (!matchedKey) continue;

            const maybeBinary = map[matchedKey];
            if (!isBinaryMixtureDataLike(maybeBinary)) continue;

            const selected: BinaryMixtureData = {};
            for (const [k, v] of Object.entries(maybeBinary as Record<string, unknown>)) {
                if (isMatrixLike(v)) selected[k] = v as MoziMatrixData;
            }
            if (Object.keys(selected).length > 0) return selected;
        }

        // Case 3: fallback to first nested BinaryMixtureData in the map.
        for (const value of Object.values(map)) {
            if (!isBinaryMixtureDataLike(value)) continue;
            const fallback: BinaryMixtureData = {};
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
                if (isMatrixLike(v)) fallback[k] = v as MoziMatrixData;
            }
            if (Object.keys(fallback).length > 0) return fallback;
        }

        return {};
    }

    private anyMatrixSource(): MoziMatrixData | null {
        const first = Object.values(this.binaryMixtureData)[0];
        return first ?? null;
    }

    private resolveMixtureId(mixtureId?: string): string | null {
        const matrixSource = this.anyMatrixSource();
        if (!matrixSource) return null;

        try {
            if (!mixtureId || mixtureId.trim().length === 0) {
                return this.defaultMixtureId;
            }
            return matrixSource.findMainMixtureName(mixtureId);
        } catch {
            return this.defaultMixtureId;
        }
    }

    private resolveDefaultMixtureId(): string | null {
        const matrixSource = this.anyMatrixSource();
        if (!matrixSource) return null;

        const candidates = [this.forwardMixtureId, this.reverseMixtureId]
            .filter(id => typeof id === "string" && id.length > 0);

        for (const candidate of candidates) {
            try {
                return matrixSource.findMainMixtureName(candidate);
            } catch {
                continue;
            }
        }

        return candidates[0] ?? null;
    }

    public mixtureIds(): string[] {
        const ids = [this.defaultMixtureId, this.forwardMixtureId, this.reverseMixtureId]
            .filter((id): id is string => !!id && id.length > 0);
        return Array.from(new Set(ids));
    }

    public props(mixtureId?: string): string[] {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return [];
            return this.source.getMixturePropertySymbols(
                { [resolvedMixtureId]: this.binaryMixtureData },
                resolvedMixtureId
            );
        } catch {
            return [];
        }
    }

    public src(propertySymbol: string, mixtureId?: string): MoziMatrixData | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;
            return this.source.getMixturePropertySource(
                { [resolvedMixtureId]: this.binaryMixtureData },
                resolvedMixtureId,
                propertySymbol
            );
        } catch {
            return null;
        }
    }

    public row(
        propertySymbol: string,
        component: Component,
        mixtureId?: string
    ): number[] | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;

            const matrixSource = this.src(propertySymbol, resolvedMixtureId);
            if (!matrixSource) return null;

            return matrixSource.getProperty(propertySymbol, component, resolvedMixtureId);
        } catch {
            return null;
        }
    }

    public prop(
        propertySymbol: string,
        pair: Component[],
        mixtureId?: string
    ): CustomProperty | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;

            const matrixSource = this.src(propertySymbol, resolvedMixtureId);
            if (!matrixSource) return null;

            return matrixSource.getMatrixProperty(
                propertySymbol,
                pair,
                resolvedMixtureId,
                this.componentKey
            );
        } catch {
            return null;
        }
    }

    public ij(
        propertySymbol: string,
        mixtureId?: string,
        componentKey: ComponentKey = this.componentKey,
        keyDelimiter = "_"
    ): CustomProperty | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;

            const matrixSource = this.src(propertySymbol, resolvedMixtureId);
            if (!matrixSource) return null;

            return matrixSource.ij(
                propertySymbol,
                resolvedMixtureId,
                componentKey,
                keyDelimiter
            );
        } catch {
            return null;
        }
    }

    public ijs(
        propertySymbol: string,
        componentKey: ComponentKey = this.componentKey,
        keyDelimiter = "_"
    ): { [componentPair: string]: number } | null {
        try {
            const matrixSource = this.src(propertySymbol);
            if (!matrixSource) return null;
            return matrixSource.ijs(propertySymbol, componentKey, keyDelimiter);
        } catch {
            return null;
        }
    }

    public mat(
        propertySymbol: string,
        components: Component[],
        mixtureId?: string,
        componentKey: ComponentKey = this.componentKey,
        keyDelimiter = "_"
    ): number[][] | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;

            const matrixSource = this.src(propertySymbol, resolvedMixtureId);
            if (!matrixSource) return null;

            return matrixSource.mat(propertySymbol, components, componentKey, keyDelimiter);
        } catch {
            return null;
        }
    }

    public matDict(
        propertySymbol: string,
        components: Component[],
        mixtureId?: string,
        componentKey: ComponentKey = this.componentKey,
        keyDelimiter = "_"
    ): { [key: string]: number } | null {
        try {
            const resolvedMixtureId = this.resolveMixtureId(mixtureId);
            if (!resolvedMixtureId) return null;

            const matrixSource = this.src(propertySymbol, resolvedMixtureId);
            if (!matrixSource) return null;

            return matrixSource.matDict(propertySymbol, components, componentKey, keyDelimiter);
        } catch {
            return null;
        }
    }
}
