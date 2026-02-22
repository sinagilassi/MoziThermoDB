// import libs

// NOTE: Raw ThermoRecord
export type RawThermoRecord = { name: string; symbol: string; value: number | string; unit: string }

// NOTE: ThermoRecord taken from database
export type ThermoRecord = { name: string; symbol: string; value: number; unit: string }

// NOTE: ThermoRecordMap is a map of symbol to ThermoRecord
export type ThermoRecordMap = {
    [symbol: string]: {
        value: number;
        unit: string;
        symbol: string;
    }
}

