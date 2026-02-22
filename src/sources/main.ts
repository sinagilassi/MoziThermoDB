import { set_component_id } from "mozithermodb-settings";
import type { Component, ComponentKey } from "mozithermodb-settings";
import type { ModelSource } from "@/types/sources";
import { Source } from "./source";
import { DataSourceCore } from "./datasource-core";
import { EquationSourceCore } from "./equationsource-core";
import { EquationSourcesCore } from "./equationsources-core";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object";

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
