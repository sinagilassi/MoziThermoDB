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

/**
 * Extracts component information from a raw thermo record set by matching against the provided component key, then builds and returns a `Component` object.
 *
 * Throws if required identity records are missing or if the constructed component does not match the expected format.
 * @param data
 * @returns Component
 */
export const getMixtureComponents = (
    data: RawThermoRecord[],
    componentKeyParts: string[] = ["Name", "Formula", "State"]
): Component => {
    // >> extract component
    const componentData: Record<string, any> = {}

    // iterate over component key parts and find matching records
    for (const part of componentKeyParts) {
        const partNormalized = String(part).toLowerCase();
        const record = data.find(r =>
            String(r.name).toLowerCase() === partNormalized
        );

        // >> check
        if (!record) {
            throw new Error(`Missing '${part}' record in data for component extraction.`);
        }

        componentData[part] = record.value;
    }

    // NOTE: build component
    const component: Component = {
        name: String(componentData["Name"] || ""),
        formula: String(componentData["Formula"] || ""),
        state: String(componentData["State"] || "") as Component["state"],
        mole_fraction: 0
    }

    // res
    return component;
}

/**
 * Extracts unique mixture property symbols and units from a raw thermo record set based on a specified identifier pattern (e.g. "_i_j").
 * @param data - the raw thermo records to analyze
 * @param propIdentifier - the substring used to identify mixture property symbols (default: "_i_j")
 * @returns an array of unique symbols and their corresponding units for mixture properties found in the data
 */
export const getMixtureProps = (
    data: RawThermoRecord[],
    propIdentifier: string
): { symbol: string, unit: string }[] => {
    const uniqueBySymbol = new Map<string, { symbol: string, unit: string }>();

    data
        .filter(record =>
            typeof record.symbol === "string" &&
            record.symbol.includes(propIdentifier)
        )
        .map(record => {
            const sym = String(record.symbol);
            const prefix = sym.split(propIdentifier)[0]; // "a_i_j_1" → "a"
            return {
                symbol: prefix,
                unit: String(record.unit),
            }
        })
        .forEach(item => {
            if (!uniqueBySymbol.has(item.symbol)) {
                uniqueBySymbol.set(item.symbol, item);
            }
        });

    return Array.from(uniqueBySymbol.values());
};

// SECTION: Build raw thermo data from query results
export const buildComponentRawThermoDataFromQueryResults = (
    component: Component,
    queryResults: Record<string, string | number>,
    payload: RawThermoRecord[],
    componentKey: ComponentKey = "Name-Formula",
): ComponentRawThermoData => {
    // NOTE: init res
    const rawRecords: Record<string, string | number>[] = [];

    // NOTE: iterate over query results
    for (const [key, value] of Object.entries(queryResults)) {
        // add symbol, value
        rawRecords.push({
            symbol: key,
            value
        });
    }

    // NOTE: build component raw thermo data
    const componentRawData = buildComponentRawThermoData(
        component,
        rawRecords,
        payload,
        componentKey
    );

    return componentRawData;
}