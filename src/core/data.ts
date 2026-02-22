// import libs
// ! LOCALS
import { RawThermoRecord, ThermoRecord, ThermoRecordMap } from '@/types';
import { cleanRawThermoRecord } from '@/utils';



export class MoziData {
    // SECTION: Attributes
    name: string = 'Thermo Data';
    description: string = 'A collection of thermodynamic data records';

    // SECTION: thermo data
    rawThermoRecord: RawThermoRecord[] = [];
    data: ThermoRecord[] = [];

    // NOTE: created at
    createdAt: Date = new Date();

    // NOTE: constructor
    constructor(
        data: RawThermoRecord[],
        name?: string,
        description?: string
    ) {
        // set name and description if provided
        if (name) this.name = name;
        if (description) this.description = description;

        this.addData = data;
    }

    set addData(records: RawThermoRecord[]) {
        this.rawThermoRecord = [];
        this.data = [];

        this.rawThermoRecord.push(...records);
        this.data = cleanRawThermoRecord(this.rawThermoRecord);
    }

    // NOTE: Retrieve Data
    getData() {
        return this.data;
    }

    // NOTE: Retrieve original raw thermo records (mixed string/number values)
    getRawData() {
        return this.rawThermoRecord;
    }

    // NOTE: Retrieve Data by Symbol
    getDataBySymbol(symbol: string): ThermoRecordMap {
        const record_ = this.data.find(record => record.symbol === symbol);
        if (!record_) {
            throw new Error(`Symbol ${symbol} not found in data`);
        }

        return {
            [record_.symbol]: {
                value: record_.value,
                unit: record_.unit,
                symbol: record_.symbol
            }
        };
    }

    // NOTE: Retrieve Data by Name
    getDataByName(name: string): ThermoRecordMap {
        const record_ = this.data.find(record => record.name === name);
        if (!record_) {
            throw new Error(`Name ${name} not found in data`);
        }

        return {
            [record_.symbol]: {
                value: record_.value,
                unit: record_.unit,
                symbol: record_.symbol
            }
        };
    }

    // NOTE: Retrieve all data as a map of symbol to value/unit
    getDataAsMap(): ThermoRecordMap {
        const dataMap: ThermoRecordMap = {};

        // iterate over data and populate map
        this.data.forEach(record => {
            dataMap[record.symbol] = {
                value: record.value,
                unit: record.unit,
                symbol: record.symbol
            };
        });

        // res
        return dataMap;
    }

    // SECTION: Utility Methods
    // NOTE: Add a new record to the data
    addRecord(record: RawThermoRecord) {
        this.rawThermoRecord.push(record);
        this.data = cleanRawThermoRecord(this.rawThermoRecord);
    }

    // NOTE: Remove a record by symbol
    removeRecordBySymbol(symbol: string) {
        this.rawThermoRecord = this.rawThermoRecord.filter(record => record.symbol !== symbol);
        this.data = this.data.filter(record => record.symbol !== symbol);
    }

    // NOTE: Update a record by symbol
    updateRecordBySymbol(symbol: string, newValue: number, newUnit?: string) {
        const record_ = this.data.find(record => record.symbol === symbol);
        if (!record_) {
            throw new Error(`Symbol ${symbol} not found in data`);
        }

        const rawRecord = this.rawThermoRecord.find(record => record.symbol === symbol);
        if (rawRecord) {
            rawRecord.value = newValue;
            if (newUnit) {
                rawRecord.unit = newUnit;
            }
        }

        record_.value = newValue;
        if (newUnit) {
            record_.unit = newUnit;
        }
    }

    // NOTE: Clear all data records
    clearData() {
        this.rawThermoRecord = [];
        this.data = [];
    }

    // NOTE: Add new records from an array of RawThermoRecords, then clean
    addRecords(records: RawThermoRecord[]) {
        this.rawThermoRecord.push(...records);
        this.data = cleanRawThermoRecord(this.rawThermoRecord);
    }
}
