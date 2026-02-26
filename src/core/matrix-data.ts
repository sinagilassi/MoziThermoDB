// import libs
import { type Component, ComponentKey, set_component_id, CustomProperty, create_binary_mixture_id } from 'mozithermodb-settings';
// ! LOCALS
import {
    RawThermoRecord,
    ThermoRecordMap,
    MixtureRawThermoData,
    MixtureComponentsRawThermoData
} from '@/types';
import { cleanRawThermoRecord, getMixtureComponents, getMixtureProps } from '@/utils';

// SECTION: Types & Interfaces
type Props = {
    symbol: string;
    unit: string;
}

type ThermoMatrixRecordMap = {
    [mixture: string]: {
        mixtureIds: string[];
        mixtureComponentIds: string[];
        components: Component[];
        records: { [componentId: string]: RawThermoRecord[] }; // e.g. "Name-Formula" -> RawThermoRecord[]
        props: Props[]; // list of available property symbols for this mixture with units
    };
}

// NOTE: Property data for a mixture
type PropData = {
    [propertySymbol: string]: number[][];
}

type MixturePropData = {
    [mixture: string]: PropData;
}

export class MoziMatrixData {
    // SECTION: Attributes
    name: string = 'Thermo Matrix Data'
    description: string = 'A collection of thermodynamic data records for mixtures';

    // mixture delimiter (e.g. "|", "||") - used to split mixture name into component names
    mixtureDelimiter: string = "|";

    // property symbol identifier for mixture properties (e.g. "_i_j")
    propIdentifier: string = "_i_j";

    // SECTION: thermo data
    rawThermoRecord: RawThermoRecord[][] = [];
    // NOTE: mixture raw data
    matrixRawData: RawThermoRecord[][] = [];
    // NOTE: mixture data
    matrixData: ThermoMatrixRecordMap = {};
    // NOTE: mixture property matrices, keyed by mixture name and then property symbol
    mixturePropertyMatrices: MixturePropData = {};

    // NOTE: created at
    createdAt: Date = new Date();

    // NOTE: mixture names
    mixtureIds: string[] = [];

    // SECTION: constructor
    constructor(
        public data: RawThermoRecord[][],
        public componentKey: ComponentKey = "Name-Formula",
        name?: string,
        description?: string
    ) {
        // set name and description if provided
        if (name) this.name = name;
        if (description) this.description = description;

        // ! raw thermo records
        this.rawThermoRecord = data;

        // NOTE: normalize mixture data
        this.matrixData = this.normalizeMixture();

        // NOTE: get mixture ids (component name || component name)
        this.mixtureIds = this.matrixData ? Object.keys(this.matrixData) : [];

        // NOTE: build property matrices for each mixture
        this.mixturePropertyMatrices = this.buildAllMixturePropertyMatrices();
    }

    // NOTE: Retrieve original raw thermo records (mixed string/number values)
    getRawData() {
        return this.rawThermoRecord;
    }

    // NOTE: Retrieve Data
    getData() {
        return this.matrixData;
    }

    // NOTE: get mixture names
    getMixtureNames(): string[] {
        // mixture names
        const mixtureNames = []

        // iterate over raw thermo records
        for (const recordSet of this.rawThermoRecord) {
            const mixtureNameRecord = recordSet.find(r => r.name.toLowerCase() === "mixture");
            if (mixtureNameRecord) {
                mixtureNames.push(String(mixtureNameRecord.value));
            }
        }

        // remove duplicates
        return Array.from(new Set(mixtureNames));
    }

    // NOTE: get component index for mixture
    getComponentIndex(mixtureName: string): { [componentId: string]: string } {
        // components
        const components: Component[] = this.matrixData[mixtureName].components;
        const componentNames = components.map(c => c.name);
        const componentFormulas = components.map(c => c.formula);
        const componentIds = components.map(component => set_component_id(component, this.componentKey));

        // mixture ids
        const mixtureComponentIds = this.matrixData[mixtureName].mixtureComponentIds;

        // res
        const res: { [componentId: string]: string } = {};

        // iterate over mixture ids
        mixtureComponentIds.forEach((id, index) => {
            // find component index by matching id to component name or formula
            const componentIndex = componentIds.findIndex(componentId => componentId.toLowerCase() === id.toLowerCase() || componentNames[componentIds.indexOf(componentId)].toLowerCase() === id.toLowerCase() || componentFormulas[componentIds.indexOf(componentId)].toLowerCase() === id.toLowerCase());

            // if component index found, add to res
            if (componentIndex !== -1) {
                res[componentIds[componentIndex]] = id;
            } else {
                throw new Error(`Component with id '${id}' not found in mixture '${mixtureName}'.`);
            }
        });

        return res;
    }

    // NOTE: normalize mixture
    normalizeMixture() {
        // get mixture names
        const mixtureNames = this.getMixtureNames();

        // build mixture components map
        const res: ThermoMatrixRecordMap = {};
        // initialize matrix data
        mixtureNames.forEach(mixture => {
            // mixture component ids (e.g. "methanol|ethanol" → ["methanol", "ethanol"])
            const mixtureComponentIds = mixture.split(this.mixtureDelimiter).map(name => name.trim());

            // mixture ids
            const mixtureId1 = mixtureComponentIds[0] + this.mixtureDelimiter + mixtureComponentIds[1]; // e.g. "methanol|ethanol"
            const mixtureId2 = mixtureComponentIds[1] + this.mixtureDelimiter + mixtureComponentIds[0]; // e.g. "ethanol|methanol"

            res[mixture] = {
                mixtureIds: [mixtureId1, mixtureId2],
                mixtureComponentIds,
                components: [],
                records: {},
                props: []
            };
        });

        this.rawThermoRecord.forEach(record => {
            // loop over records
            record.forEach(row => {
                // find mixture name record
                const mixtureNameRecord = record.find(r => r.name.toLowerCase() === "mixture");
                if (!mixtureNameRecord) return;

                // ! component name/formula/state records
                const componentNameRecord = record.find(r => r.name.toLowerCase() === "name");
                const componentFormulaRecord = record.find(r => r.name.toLowerCase() === "formula");
                const componentStateRecord = record.find(r => r.name.toLowerCase() === "state");

                if (!componentNameRecord || !componentFormulaRecord || !componentStateRecord) {
                    throw new Error("Missing required component identity records (Name, Formula, State) in data for mixture normalization.");
                }

                // build component
                const component: Component = {
                    name: String(componentNameRecord.value),
                    formula: String(componentFormulaRecord.value),
                    state: String(componentStateRecord.value) as Component["state"],
                    mole_fraction: 0
                };

                // add component to mixture components map
                res[mixtureNameRecord.value as string].components.push(component);

                // ! raw thermo records for this component
                const componentRawRecords = cleanRawThermoRecord(record)

                // add raw thermo records to mixture records map under component key
                const componentId = set_component_id(component, this.componentKey);
                res[mixtureNameRecord.value as string].records[componentId] = componentRawRecords;

                // ! get properties for this mixture
                const props = getMixtureProps(record, this.propIdentifier);
                res[mixtureNameRecord.value as string].props = props;
            });
        });

        // res
        return res;
    }

    // SECTION: build matrix data by properties
    buildPropertyMatrix(
        propId: string,
        mixtureId: string,
    ): number[][] {
        // get mixture data
        const mixtureData = this.matrixData[mixtureId];

        // res
        const res: number[][] = [];

        // create prop prefix
        const propPrefix = `${propId}_`;

        // iterate over mixture records and extract property values for each component
        Object.entries(mixtureData.records).forEach(([componentId, records]) => {
            // find records for this property
            const propRecords = records.filter(r => r.symbol.toLowerCase().startsWith(propPrefix.toLowerCase()));

            // extract property values and add to res
            const propValues = propRecords.map(r => typeof r.value === "number" ? r.value : parseFloat(r.value));
            res.push(propValues);
        });

        return res;
    }

    buildAllPropertyMatrices(mixtureId: string): PropData {
        // get mixture data
        const mixtureData = this.matrixData[mixtureId];
        // get property symbols for this mixture
        const propSymbols = mixtureData.props.map(p => p.symbol);

        // res
        const res: PropData = {};

        // iterate over property symbols and build matrix for each property
        propSymbols.forEach(propId => {
            res[propId] = this.buildPropertyMatrix(propId, mixtureId);
        });

        return res;
    }

    buildAllMixturePropertyMatrices(): MixturePropData {
        // res
        const res: MixturePropData = {};

        // iterate over mixtures and build property matrices for each mixture
        this.mixtureIds.forEach(mixtureId => {
            res[mixtureId] = this.buildAllPropertyMatrices(mixtureId);
        });

        return res;
    }

    propertyMatrix(mixtureId: string, propId: string): number[][] {
        // check if mixture exists
        if (!this.matrixData[mixtureId]) {
            throw new Error(`Mixture with id '${mixtureId}' not found.`);
        }
        // check if property exists for this mixture
        if (!this.mixturePropertyMatrices[mixtureId][propId]) {
            throw new Error(`Property with id '${propId}' not found for mixture '${mixtureId}'.`);
        }
        return this.mixturePropertyMatrices[mixtureId][propId];
    }

    // SECTION: get matrix data by properties
    getProperty(
        propertySymbol: string,
        component: Component,
        mixtureId: string,
    ): number[] {
        // NOTE: property symbol format: "prop_i_j" where i and j are component indices in the mixture
        const propPrefix = propertySymbol.split("_")[0]; // e.g. "a_i_j"

        // NOTE: get mixture data
        const propData = this.mixturePropertyMatrices[mixtureId][propertySymbol];

        if (!propData) {
            throw new Error(`Property with symbol '${propertySymbol}' not found for mixture '${mixtureId}'.`);
        }

        // NOTE: find component index in mixture
        const componentIndex = this.getComponentIndex(mixtureId)[set_component_id(component, this.componentKey)];

        if (componentIndex === undefined) {
            throw new Error(`Component '${component.name}' not found in mixture '${mixtureId}'.`);
        }

        // NOTE: extract property values for this component from the property matrix
        const componentPropValues = propData.map(row => row[Number(componentIndex)]);

        return componentPropValues;
    }

    // NOTE:
    getMatrixProperty(
        propertySymbol: string,
        components: Component[],
        mixtureId: string,
    ): CustomProperty {
        // NOTE: property symbol format: "prop_i_j" where i and j are component indices in the mixture
        const propPrefix = propertySymbol.split("_")[0]; // e.g. "a_i_j"

        // NOTE: get mixture data
        const propData = this.mixturePropertyMatrices[mixtureId][propertySymbol];

        // NOTE: find component indices in mixture
        const componentIndices = components.map(component => {
            const index = this.getComponentIndex(mixtureId)[set_component_id(component, this.componentKey)];
            if (index === undefined) {
                throw new Error(`Component '${component.name}' not found in mixture '${mixtureId}'.`);
            }
            return Number(index);
        });

        // NOTE: extract property values for these components from the property matrix
        const matrixValues = propData.map(row => componentIndices.map(i => row[i]));


    }

}