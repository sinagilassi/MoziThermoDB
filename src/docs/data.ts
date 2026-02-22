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
export type ComponentMoziData = { [key: string]: MoziData };



export const buildComponentData = (
    data: ThermoRecord[],
    component: Component,
    componentKey: ComponentKey = "Name-Formula",
    name?: string,
    description?: string,
) => {
    // NOTE: set component ID based on key
    const componentId = set_component_id(component, componentKey);

    // NOTE: create MoziData instance
    const moziData = new MoziData(data, name, description);

    // NOTE: return map keyed by component ID
    return {
        [componentId]: moziData.getDataAsMap()
    };
}