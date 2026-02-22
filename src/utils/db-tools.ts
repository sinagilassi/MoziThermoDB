// import libs
import { set_component_id } from 'mozithermodb-settings';
import type { Component, ComponentKey } from 'mozithermodb-settings';
import { ThermoRecord, RawThermoRecord } from '@/types/database';

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

export const getComponentIdFromRawThermoRecord = (
    data: RawThermoRecord[],
    componentKey: ComponentKey = "Name-Formula"
): string => {
    const keyParts = String(componentKey).split("-");

    const dataValues = keyParts.map(part => {
        const record = data.find(r => r.symbol === part || r.name === part);
        if (!record) {
            throw new Error(`Missing '${part}' record in data for component match check.`);
        }

        return String(record.value);
    });

    return dataValues.join("-");
};

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
