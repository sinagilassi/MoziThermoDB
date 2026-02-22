// import libs
import {
    Component,
    ComponentKey,
    set_component_id
} from 'mozithermodb-settings';
// ! LOCALS
import { ThermoRecord, ThermoRecordMap } from '@/types';
import { MoziData } from '@/core';


// NOTE: Type for the map returned by `configureData`, keyed by component ID
export type ComponentData = { [key: string]: ThermoRecordMap };



export const buildData = (
    data: ThermoRecord[],
    name?: string,
    description?: string,
) => {
    // NOTE: create MoziData instance
    const moziData = new MoziData(data, name, description);

    // NOTE: return
    return moziData.getDataAsMap()
}

export const buildComponentData = (
    component: Component,
    data: ThermoRecord[],
    componentKey: ComponentKey[] = ["Name-Formula", "Formula-State", "Name-State"]
): ComponentData => {
    // NOTE: resolve component ids
    const componentIds = componentKey.map(key => set_component_id(component, key));

    // NOTE: create MoziData instance
    const moziData = new MoziData(data);

    // NOTE: return map keyed by component id
    const dataMap = moziData.getDataAsMap();
    const componentData: ComponentData = {};

    componentIds.forEach(id => {
        componentData[id] = dataMap;
    });

    return componentData;
}