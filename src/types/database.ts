import { Component } from 'mozithermodb-settings';
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

// NOTE: Component raw thermo data
export type ComponentRawThermoData = {
    component: Component;
    records: RawThermoRecord[];
}

// NOTE: ComponentData is a map of component id to ThermoRecordMap
export type ComponentThermoData = {
    component: Component;
    records: ThermoRecordMap;
}

// SECTION: Mixture data types
// NOTE: Mixture components raw thermo data, containing the list of components and the raw thermo records for the mixture
export type MixtureComponentsRawThermoData = {
    components: Component[];
    records: RawThermoRecord[];
}

// NOTE: MixtureRawThermoData is a map of mixture name to raw thermo records for that mixture
export type MixtureRawThermoData = {
    [mixture: string]: MixtureComponentsRawThermoData;
}

// NOTE: ThermoMatrixRecordMap is a map of mixture value to ThermoRecordMap
export type ThermoMatrixRecordMap = {
    [mixture: string]: ThermoRecordMap;
}

// NOTE: Mixture thermo data
export type MixtureThermoData = {
    components: Component[];
    records: ThermoMatrixRecordMap;
}