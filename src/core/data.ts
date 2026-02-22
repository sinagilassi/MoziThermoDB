// import libs
// ! LOCALS
import { ThermoRecord, ThermoRecordMap } from '@/types';



export class MoziData {
    // SECTION: Attributes
    name: string = 'Thermo Data';
    description: string = 'A collection of thermodynamic data records';

    // NOTE: created at
    createdAt: Date = new Date();

    // NOTE: constructor
    constructor(
        public data: ThermoRecord[],
        name?: string,
        description?: string
    ) {
        // set name and description if provided
        if (name) this.name = name;
        if (description) this.description = description;
    }

    // NOTE: Retrieve Data
    getData() {
        return this.data;
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
    addRecord(record: ThermoRecord) {
        this.data.push(record);
    }

    // NOTE: Remove a record by symbol
    removeRecordBySymbol(symbol: string) {
        this.data = this.data.filter(record => record.symbol !== symbol);
    }

    // NOTE: Update a record by symbol
    updateRecordBySymbol(symbol: string, newValue: number, newUnit?: string) {
        const record_ = this.data.find(record => record.symbol === symbol);
        if (!record_) {
            throw new Error(`Symbol ${symbol} not found in data`);
        }

        record_.value = newValue;
        if (newUnit) {
            record_.unit = newUnit;
        }
    }

    // NOTE: Clear all data records
    clearData() {
        this.data = [];
    }

    // NOTE: Add new records from an array of ThermoRecords
    addRecords(records: ThermoRecord[]) {
        this.data.push(...records);
    }
}