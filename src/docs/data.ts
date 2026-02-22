// import libs
import {
    Component,
    ComponentKey,
    set_component_id
} from 'mozithermodb-settings';
// ! LOCALS
import { RawThermoRecord, ThermoRecordMap } from '@/types';
import { MoziData } from '@/core';
import { assertRawThermoRecordMatchesComponent } from '@/utils';


// NOTE: Type for the map returned by `configureData`, keyed by component ID
export type ComponentData = { [key: string]: ThermoRecordMap };


/**
 * Build a cleaned thermo-data map from raw thermo records.
 *
 * Purpose
 * - Accept raw DB records with mixed `string | number` values
 * - Remove non-numeric metadata rows during cleaning (e.g. `Name`, `Formula`, `State`)
 * - Return a symbol-keyed `ThermoRecordMap` containing numeric values only
 *
 * Notes
 * - Uses `MoziData`, which stores both raw records and cleaned numeric records internally
 * - Returned map is suitable for equation/data-source usage
 */
export const buildData = (
    data: RawThermoRecord[],
    name?: string,
    description?: string,
) => {
    // NOTE: create MoziData instance
    const moziData = new MoziData(data, name, description);

    // NOTE: return
    return moziData.getDataAsMap()
}

/**
 * Build a component-keyed thermo-data source from raw thermo records.
 *
 * Purpose
 * - Clean raw component records to numeric thermo records
 * - Expose the same cleaned symbol-keyed data under one or more component-id aliases
 *
 * Notes
 * - `componentKey` controls which component-id variants are generated
 * - Each generated component id points to the same cleaned `ThermoRecordMap` for that component
 * - Optional guard can verify the provided `data` belongs to the provided `component`
 *   by comparing a component id built from raw data rows (e.g. `"Name-Formula"`)
 *
 * Guard args
 * - `enableDataComponentMatchCheck`: enables component/data validation before building
 * - `dataComponentMatchKey`: key format used for validation (e.g. `"Name-Formula"`)
 *
 * Returns
 * - `ComponentData` map: `{ [componentId]: ThermoRecordMap }`
 */
export const buildComponentData = (
    component: Component,
    data: RawThermoRecord[],
    componentKey: ComponentKey[] = ["Name-Formula", "Formula-State", "Name-State"],
    enableDataComponentMatchCheck: boolean = false,
    dataComponentMatchKey: ComponentKey = "Name-Formula"
): ComponentData => {
    if (enableDataComponentMatchCheck) {
        assertRawThermoRecordMatchesComponent(component, data, dataComponentMatchKey);
    }

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
