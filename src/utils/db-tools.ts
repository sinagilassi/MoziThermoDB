// import libs
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