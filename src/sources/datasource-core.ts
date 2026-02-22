import { Component, ComponentKey, set_component_id } from "mozithermodb-settings";
import type { ThermoRecordMap } from "@/types";
import { Source } from "./source";

type PropResult = { value: number; unit: string; symbol: string };

export class DataSourceCore {
    public component: Component;
    public source: Source;
    public componentKey: ComponentKey;
    public componentId: string;
    public componentData: ThermoRecordMap | null;

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
        this.componentData = this.source.componentDataExtractor(this.componentId);
    }

    public props(): string[] {
        try {
            if (!this.componentData) return [];
            return Object.keys(this.componentData);
        } catch {
            return [];
        }
    }

    public prop(name: string): PropResult | null {
        try {
            if (!this.componentData) return null;

            const record = this.componentData[name];
            if (!record) return null;

            return {
                value: Number(record.value),
                unit: record.unit,
                symbol: record.symbol
            };
        } catch {
            return null;
        }
    }
}
