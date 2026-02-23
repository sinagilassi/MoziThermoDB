/**
 * Utility helpers for validating, normalizing, and extracting thermo database
 * records and component-linked payloads.
 */
// import libs
import { set_component_id } from 'mozithermodb-settings';
import type { Component, ComponentKey } from 'mozithermodb-settings';
// ! LOCALS
import { ThermoRecord, RawThermoRecord, ComponentThermoData, ComponentRawThermoData } from '@/types/database';

/**
 * Removes non-thermo identity fields and coerces numeric-like values to numbers.
 * Invalid numeric values are dropped from the result.
 */
export const cleanRawThermoRecord = (
    data: RawThermoRecord[],
    ignoreNames: string[] = ["Name", "Formula", "State", "CAS", "InChI", "SMILES"]
): ThermoRecord[] => {

    return data
        .filter(record => !ignoreNames.includes(record.name))
        .flatMap(record => {
            const value =
                typeof record.value === "string"
                    ? Number(record.value)
                    : record.value;

            if (typeof value === "number" && !isNaN(value)) {
                return [{ ...record, value }];
            }

            return []; // removes invalid
        });
};

/**
 * Builds a component identifier from raw thermo records using the selected
 * component key format (for example, `Name-Formula`).
 *
 * Throws if any key part cannot be found in the provided records.
 */
export const getComponentIdFromRawThermoRecord = (
    data: RawThermoRecord[],
    componentKey: ComponentKey = "Name-Formula"
): string => {
    const keyParts = String(componentKey).split("-");

    const dataValues = keyParts.map(part => {
        const partNormalized = String(part).toLowerCase();
        const record = data.find(r =>
            String(r.symbol).toLowerCase() === partNormalized ||
            String(r.name).toLowerCase() === partNormalized
        );
        if (!record) {
            throw new Error(`Missing '${part}' record in data for component match check.`);
        }

        return String(record.value);
    });

    return dataValues.join("-");
};

/**
 * Verifies that a raw thermo record set belongs to the given component.
 *
 * Throws when the computed identifier from raw data does not match the
 * component identifier.
 */
export const assertRawThermoRecordMatchesComponent = (
    component: Component,
    data: RawThermoRecord[],
    componentKey: ComponentKey = "Name-Formula"
): void => {
    const expectedComponentId = set_component_id(component, componentKey);
    const dataComponentId = getComponentIdFromRawThermoRecord(data, componentKey);

    if (dataComponentId !== expectedComponentId) {
        throw new Error(
            `Component/data mismatch using key '${componentKey}': expected '${expectedComponentId}', got '${dataComponentId}'.`
        );
    }
};

// SECTION: Extract component info from raw data
/**
 * Finds and returns the raw thermo record entry that matches a component from a
 * collection of raw record groups.
 *
 * Throws if no matching entry is found.
 */
export const extractComponentDataFromRawThermoRecord = (
    component: Component,
    data: RawThermoRecord[][],
    componentKey: ComponentKey = "Name-Formula"
): ComponentRawThermoData => {
    // Find the matching data entry for the component
    const matchingData = data.find(entry => {
        try {
            assertRawThermoRecordMatchesComponent(component, entry, componentKey);
            return true;
        } catch {
            return false;
        }
    });

    if (!matchingData) {
        throw new Error(`No matching data found for component '${component.name}' using key '${componentKey}'.`);
    }

    return {
        component,
        records: matchingData
    };
}

// SECTION: Build component raw thermo data from { symbol, value } pairs (e.g. from attached data)
/**
 * Builds component raw thermo data by cloning a payload template and updating
 * matching record values from loose `{ symbol, value }` items, then validates
 * the result against the component key.
 *
 * Throws if the constructed records do not match the provided component.
 */
export const buildComponentRawThermoData = (
    component: Component,
    data: any[],
    payload: RawThermoRecord[],
    componentKey: ComponentKey = "Name-Formula"
): ComponentRawThermoData => {
    // Clone the payload template and patch in values from attached pairs.
    const rawRecords: RawThermoRecord[] = payload.map(record => ({ ...record }));

    for (const item of data) {
        const itemKey =
            item?.symbol != null
                ? String(item.symbol)
                : item?.name != null
                    ? String(item.name)
                    : "";

        if (!itemKey) continue;

        const itemKeyNormalized = itemKey.toLowerCase();
        const target = rawRecords.find(r =>
            String(r.symbol).toLowerCase() === itemKeyNormalized ||
            String(r.name).toLowerCase() === itemKeyNormalized
        );

        if (!target) continue;

        target.value = item.value;
    }

    // Validate that the constructed raw records match the component
    assertRawThermoRecordMatchesComponent(component, rawRecords, componentKey);

    return {
        component,
        records: rawRecords
    };
};
