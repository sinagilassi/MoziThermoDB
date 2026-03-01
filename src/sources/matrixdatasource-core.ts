import {
    type Component,
    type ComponentKey,
    type BinaryMixtureKey,
    type CustomProperty,
    create_binary_mixture_id
} from "mozithermodb-settings";
import type { BinaryMixtureData } from "@/docs/matrix-data";
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

        const res: BinaryMixtureData = {};
        for (const [key, value] of Object.entries(dataSource as Record<string, unknown>)) {
            if (value instanceof MoziMatrixData) {
                res[key] = value;
            }
        }

        return res;
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
