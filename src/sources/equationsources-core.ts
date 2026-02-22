import { Component, ComponentKey, set_component_id } from "mozithermodb-settings";
import type { ComponentEquation } from "@/docs/equation";
import { Source } from "./source";
import { EquationSourceCore } from "./equationsource-core";

export class EquationSourcesCore {
    public component: Component;
    public source: Source;
    public componentKey: ComponentKey;
    public componentId: string;
    public componentEquations: ComponentEquation | null;

    constructor(
        component: Component,
        source: Source,
        componentKey: ComponentKey = "Name-Formula",
    ) {
        this.component = component;
        this.source = source;
        this.componentKey = componentKey;

        // Keep Source lookups/equation-building aligned with this wrapper's key.
        this.source.componentKey = componentKey;

        this.componentId = set_component_id(this.component, this.componentKey);
        this.componentEquations = this.source.componentEqExtractor(this.componentId);
    }

    public equations(): string[] {
        if (!this.componentEquations) return [];
        return Object.keys(this.componentEquations);
    }

    public eq(name: string): EquationSourceCore | null {
        try {
            if (!this.componentEquations) return null;

            const isAvailable = this.source.isPropEqAvailable(this.componentId, name);
            if (!isAvailable) return null;

            return new EquationSourceCore(
                name,
                this.component,
                this.source,
                this.componentKey
            );
        } catch {
            return null;
        }
    }
}
