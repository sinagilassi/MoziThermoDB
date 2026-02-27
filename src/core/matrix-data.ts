// import libs
import {
    type Component,
    type CustomProperty,
    type ComponentKey,
    type BinaryMixtureKey,
    set_component_id,
    create_binary_mixture_id,
    infer_binary_mixture_key
} from 'mozithermodb-settings';
// ! LOCALS
import {
    RawThermoRecord,
    ThermoRecordMap,
    MixtureRawThermoData,
    MixtureComponentsRawThermoData
} from '@/types';
import {
    cleanRawThermoRecord,
    getMixtureComponents,
    getMixtureProps,
    propertyParser,
    generateMixturePropertyKey,
    generateMixtureId,
    generateMixtureIds,
    findMixtureComponent,
    generateMixtureKey,
    findMixtureKey,
    findMixtureKeyFromComponents
} from '@/utils';

// SECTION: Types & Interfaces
type Props = {
    symbol: string;
    unit: string;
}

export type ThermoMatrixRecordMap = {
    [mixture: string]: {
        mixtureKey: BinaryMixtureKey | null;
        mixtureIds: string[];
        mixtureComponentIds: string[];
        components: Component[];
        records: { [componentId: string]: RawThermoRecord[] };
        props: Props[];
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

    // thermo data
    rawThermoRecord: RawThermoRecord[][] = [];
    // mixture raw data
    matrixRawData: RawThermoRecord[][] = [];
    // mixture data
    matrixData: ThermoMatrixRecordMap = {};
    // mixture property matrices, keyed by mixture name and then property symbol
    mixturePropertyMatrices: MixturePropData = {};

    // created at
    createdAt: Date = new Date();

    // mixture names
    mixtureKeys: string[] = [];

    // SECTION: constructor
    constructor(
        public data: RawThermoRecord[][],
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

        // NOTE: get mixture keys (component name || component name)
        this.mixtureKeys = this.matrixData ? Object.keys(this.matrixData) : [];

        // NOTE: build property matrices for each mixture
        this.mixturePropertyMatrices = this.buildAllMixturePropertyMatrices();
    }

    // SECTION: Retrieve original raw thermo records (mixed string/number values)
    getRawData() {
        return this.rawThermoRecord;
    }

    // SECTION: Retrieve Data
    getData() {
        return this.matrixData;
    }

    // SECTION: get mixture names
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

    // SECTION: get component index for mixture
    getComponentIndex(mixtureName: string): { [componentId: string]: number } {
        // NOTE: mixture ids
        const mixtureComponentIds = this.matrixData[mixtureName].mixtureComponentIds;
        // >> mixture key
        const mixtureKey = this.matrixData[mixtureName].mixtureKey as BinaryMixtureKey;

        // NOTE: components
        const components: Component[] = this.matrixData[mixtureName].components;
        // >> names
        const componentNames = components.map(c => c.name);
        // >> formulas
        const componentFormulas = components.map(c => c.formula);
        // >> states
        const componentStates = components.map(c => c.state);

        // NOTE: component ids
        // ! mixture key is used
        const componentIds = components.map(component => set_component_id(component, mixtureKey));

        // res
        const res: { [componentId: string]: number } = {};

        // NOTE: find component index (Reference mixture name)
        // iterate over mixture ids
        mixtureComponentIds.forEach((id, index) => {
            // find component index by matching id to component name or formula
            const componentIndex = componentIds.findIndex(
                componentId => componentId.toLowerCase() === id.toLowerCase() ||
                    componentNames[componentIds.indexOf(componentId)].toLowerCase() === id.toLowerCase() ||
                    componentFormulas[componentIds.indexOf(componentId)].toLowerCase() === id.toLowerCase()
            );

            // if component index found, add to res
            if (componentIndex !== -1) {
                res[componentIds[componentIndex]] = index;
            } else {
                throw new Error(`Component with id '${id}' not found in mixture '${mixtureName}'.`);
            }
        });

        return res;
    }

    // SECTION: Get property symbols for a mixture
    getMixturePropertySymbols(mixtureName: string): string[] {
        const props = this.matrixData[mixtureName].props;
        if (!props) {
            throw new Error(`No properties found for mixture '${mixtureName}'.`);
        }
        return props.map(p => p.symbol);
    }

    // SECTION: Get property unit
    getPropertyUnit(mixtureName: string, propertySymbol: string): string {
        const prop = this.matrixData[mixtureName].props.find(p => p.symbol === propertySymbol);
        if (!prop) {
            throw new Error(`Property with symbol '${propertySymbol}' not found for mixture '${mixtureName}'.`);
        }
        return prop.unit;
    }

    // SECTION: Get property prefix (e.g. "a" for "a_i_j")
    getPropertyPrefix(propertySymbol: string) {
        // NOTE: property symbol format: "prop_i_j" where i and j are component indices in the mixture
        const propPrefix = propertySymbol.split("_")[0]; // e.g. "a_i_j"
        return propPrefix;
    }

    // SECTION: Get property i and j placeholders from property symbol (e.g. "i" and "j" for "a_i_j")
    getPropertyPlaceholders(propertySymbol: string): { ids: string[], mode: string } {
        const parts = propertySymbol.split("_");
        if (parts.length < 3) {
            throw new Error(`Invalid property symbol format for '${propertySymbol}'. Expected format: 'prop_i_j' where i and j are component indices.`);
        }

        const placeholders = parts.slice(1); // e.g. ["i", "j"]

        // >> check aliphatic or numeric placeholders
        const mode: string = placeholders.every(p => isNaN(Number(p))) ? "alphanumeric" : "numeric";

        return { ids: placeholders, mode };
    }

    // SECTION: normalize mixture
    normalizeMixture() {
        // get mixture names
        const mixtureNames = this.getMixtureNames();

        // build mixture components map
        const res: ThermoMatrixRecordMap = {};
        // initialize matrix data
        mixtureNames.forEach(mixture => {
            // ! mixture component ids (e.g. "methanol|ethanol" → ["methanol", "ethanol"])
            // set component order, component indices
            const mixtureComponentIds = mixture.split(this.mixtureDelimiter).map(id => id.trim());

            // ! mixture ids
            const mixtureId1 = generateMixtureId(
                mixtureComponentIds[0],
                mixtureComponentIds[1],
                this.mixtureDelimiter
            )
            const mixtureId2 = generateMixtureId(
                mixtureComponentIds[1],
                mixtureComponentIds[0],
                this.mixtureDelimiter
            )

            // ! initialize mixture data in res
            res[mixture] = {
                mixtureKey: null,
                mixtureIds: [mixtureId1, mixtureId2],
                mixtureComponentIds,
                components: [],
                records: {},
                props: []
            };
        });

        // NOTE: extract data
        // iterate over raw thermo records and populate mixture components map and mixture records map
        this.rawThermoRecord.forEach(record => {
            // loop over records
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

            // ! find mixture key for this component
            const mixtureKey_ = findMixtureKey(
                String(mixtureNameRecord.value),
                component,
                ["Name", "Formula", "Name-Formula"],
                this.mixtureDelimiter
            );

            // add component to mixture components map
            res[mixtureNameRecord.value as string].components.push(component);

            // ! raw thermo records for this component
            const componentRawRecords = cleanRawThermoRecord(record)

            // add raw thermo records to mixture records map under component key
            const componentId = set_component_id(component, mixtureKey_);
            res[mixtureNameRecord.value as string].records[componentId] = componentRawRecords;

            // ! get properties for this mixture
            const props = getMixtureProps(record, this.propIdentifier);
            res[mixtureNameRecord.value as string].props = props;
        });


        // NOTE: extract mixture keys
        Object.entries(res).forEach(([mixtureName, mixtureData]) => {
            const mixtureKey = findMixtureKeyFromComponents(
                mixtureName,
                mixtureData.components,
                ["Name", "Formula", "Name-Formula"],
            )

            res[mixtureName].mixtureKey = mixtureKey;
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

        // NOTE: component indices for this mixture
        const componentIndices = this.getComponentIndex(mixtureId);

        // res
        const res: number[][] = [];

        // create prop prefix
        const propPrefix = `${propId}_`;

        // iterate over component indices
        for (const [componentId, index] of Object.entries(componentIndices)) {
            // get raw thermo records for this component
            const componentRawRecords = mixtureData.records[componentId];
            if (!componentRawRecords) {
                throw new Error(`No raw thermo records found for component with id '${componentId}' in mixture '${mixtureId}'.`);
            }
            // find records for this property (e.g. "a_i_j_1", "a_i_j_2" for propId "a_i_j")
            const propRecords = componentRawRecords.filter(r => r.symbol.startsWith(propPrefix));
            if (propRecords.length === 0) {
                throw new Error(`No records found for property with id '${propId}' for component with id '${componentId}' in mixture '${mixtureId}'.`);
            }
            // extract property values and sort by component index (e.g. "a_i_j_1" → 1, "a_i_j_2" → 2)
            const propValues = propRecords.map(r => {
                const suffix = r.symbol.slice(propPrefix.length); // e.g. "1", "2"
                const colIndex = Number(suffix); // e.g. 1, 2
                return { value: Number(r.value), colIndex };
            }).sort((a, b) => a.colIndex - b.colIndex).map(r => r.value);

            // add property values to res at the correct row index
            res[index] = propValues;
        }

        return res;
    }

    // SECTION: build all property matrices for a mixture
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

    // SECTION: build all property matrices for all mixtures
    buildAllMixturePropertyMatrices(): MixturePropData {
        // res
        const res: MixturePropData = {};

        // iterate over mixtures and build property matrices for each mixture
        this.mixtureKeys.forEach(mixtureKey => {
            res[mixtureKey] = this.buildAllPropertyMatrices(mixtureKey);
        });

        return res;
    }

    // SECTION: get property matrix for a given property and mixture
    getPropertyMatrix(mixtureId: string, propId: string): number[][] {
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
        const propPrefix = this.getPropertyPrefix(propertySymbol); // e.g. "a_i_j" → "a"

        // NOTE: get mixture data
        const propData = this.getPropertyMatrix(mixtureId, propPrefix);

        // NOTE: get mixture key
        const mixtureKey = this.matrixData[mixtureId].mixtureKey as BinaryMixtureKey;

        // NOTE: find component index in mixture
        const componentIndex = this.getComponentIndex(mixtureId)[set_component_id(component, mixtureKey)];

        if (componentIndex === undefined) {
            throw new Error(`Component '${component.name}' not found in mixture '${mixtureId}'.`);
        }

        // NOTE: extract property values for this component from the property matrix
        const componentPropValues = propData[componentIndex];

        return componentPropValues;
    }

    // SECTION: get matrix property for a pair of components in a mixture
    getMatrixProperty(
        propertySymbol: string,
        components: Component[],
        mixtureId: string,
        componentKey: ComponentKey = "Name-Formula",
        keyDelimiter: string = "_",
    ): CustomProperty {
        // NOTE: property symbol format: "prop_i_j" where i and j are component indices in the mixture
        const {
            propertyPrefix: propPrefix,
        } = propertyParser(
            propertySymbol,
        )
        // > unit for this property
        const propUnit = this.getPropertyUnit(mixtureId, propPrefix);

        // NOTE: component i and j
        const component_i = components[0];
        const component_j = components[1];

        // NOTE: get mixture data
        const propData = this.getPropertyMatrix(mixtureId, propPrefix);

        // NOTE: find component indices in mixture
        const componentIndices = components.map(component => {
            return this.getComponentIndex(mixtureId);
        });

        // NOTE: get mixture key
        const mixtureKey = this.matrixData[mixtureId].mixtureKey as BinaryMixtureKey;

        // NOTE: component i and component j indices
        const i = Number(componentIndices[0][set_component_id(component_i, mixtureKey)]);
        const j = Number(componentIndices[1][set_component_id(component_j, mixtureKey)]);

        // NOTE: extract property value for this pair of components from the property matrix
        const propValue = propData[i][j];

        // ! create custom property object
        const propKey = generateMixturePropertyKey(
            propPrefix,
            component_i,
            component_j,
            componentKey,
            keyDelimiter
        );

        const customProp: CustomProperty = {
            symbol: propKey,
            value: propValue,
            unit: propUnit
        };

        return customProp;
    }

    // SECTION: Get matrix property by symbol (e.g. "a_1_2", "a_methanol_ethanol") for a pair of components in a mixture
    ij(
        propertySymbol: string,
        mixtureId: string,
        componentKey: ComponentKey = "Name-Formula",
        keyDelimiter: string = "_"
    ): CustomProperty {
        // NOTE: property symbol format: "prop_i_j" where i and j are component indices in the mixture
        const {
            propertyPrefix: propPrefix,
            propertyDelimiter,
            i,
            j,
            mode
        } = propertyParser(propertySymbol);

        // >> place holders
        const placeholders = [i, j];

        // NOTE: components
        const mixtureComponents = this.matrixData[mixtureId].components;

        // component set for this property
        const componentsSet: Component[] = [];

        // component orders for this property
        if (mode === "numeric") {
            // component i
            const component_i = mixtureComponents[Number(placeholders[0]) - 1]; // e.g. "i" → component at index 0
            // component j
            const component_j = mixtureComponents[Number(placeholders[1]) - 1]; // e.g. "j" → component at index 1

            if (!component_i || !component_j) {
                throw new Error(`Components with indices '${placeholders[0]}' and '${placeholders[1]}' not found in mixture '${mixtureId}' for property '${propertySymbol}'.`);
            }
            componentsSet.push(component_i, component_j);
        } else if (mode === "component") {
            // component i
            const component_i = findMixtureComponent(
                placeholders[0],
                mixtureComponents,
                ["Name", "Formula", "Name-Formula"] as ComponentKey[],
            )
            // component j
            const component_j = findMixtureComponent(
                placeholders[1],
                mixtureComponents,
                ["Name", "Formula", "Name-Formula"] as ComponentKey[],
            )

            // >> check if components found
            if (!component_i || !component_j) {
                throw new Error(`Components with ids '${placeholders[0]}' and '${placeholders[1]}' not found in mixture '${mixtureId}' for property '${propertySymbol}'.`);
            }

            componentsSet.push(component_i, component_j);
        } else {
            throw new Error(`Invalid placeholder mode '${mode}' for property symbol '${propertySymbol}'. Expected 'numeric' or 'alphanumeric'.`);
        }

        // NOTE: get property value for this pair of components from the property matrix
        const propValue = this.getMatrixProperty(
            propertySymbol,
            componentsSet,
            mixtureId,
            componentKey,
            keyDelimiter
        );

        return propValue;
    }

    // SECTION: Find mixture id from component names (handles both orderings A|B and B|A)
    findMixtureId(componentNames: string[]): string {
        if (!componentNames || componentNames.length === 0) {
            throw new Error("Component names array is empty!");
        }

        // Try both orderings
        const mixtureName1 = componentNames.join(this.mixtureDelimiter); // e.g. ["methanol", "ethanol"] → "methanol|ethanol"
        const mixtureName2 = [...componentNames].reverse().join(this.mixtureDelimiter); // e.g. ["ethanol", "methanol"] → "ethanol|methanol"

        // NOTE: find mixture id that matches these components
        let res: { mixture: string, mixtureId: string } | null = null;

        // iterate over matrix data
        for (const [mixtureName, mixtureData] of Object.entries(this.matrixData)) {

            if (mixtureData.mixtureIds.includes(mixtureName1)) {
                res = { mixture: mixtureName, mixtureId: mixtureName1 };
                break;
            }

            if (mixtureData.mixtureIds.includes(mixtureName2)) {
                res = { mixture: mixtureName, mixtureId: mixtureName2 };
                break;
            }
        }

        if (!res) {
            throw new Error(`No mixture found for components '${componentNames.join(", ")}'.`);
        }
        return res.mixture;
    }

    // SECTION: Find mixture key
    findMixtureKey(mixtureIds: string[]): string {
        if (!mixtureIds || mixtureIds.length === 0) {
            throw new Error("Mixture IDs array is empty!");
        }

        const normalizedMixtureIds = mixtureIds.map(id => id.trim().toLowerCase());

        // iterate over mixture keys
        for (const mixtureKey of this.mixtureKeys) {
            const mixtureData = this.matrixData[mixtureKey];

            if (mixtureData.mixtureIds.some(id => normalizedMixtureIds.includes(id.trim().toLowerCase()))) {
                return mixtureKey;
            }
        }

        throw new Error(`No mixture key found for mixture IDs '${mixtureIds.join(", ")}'.`);
    }

    // SECTION: Get all matrix properties for a given property symbol (e.g. "a_i_j | component1 | component2" or "a | component1 | component2") for all pairs of components in a mixture
    ijs(
        propertySymbol: string,
        componentKey: ComponentKey = "Name-Formula",
        keyDelimiter: string = "_"
    ): { [componentPair: string]: number } {
        // NOTE: extract property symbol
        const {
            propertyPrefix: propPrefix,
            propertyDelimiter: propDelimiter,
            i,
            j,
            mode
        } = propertyParser(
            propertySymbol,
        )

        // NOTE: components
        const componentNames = [i, j];

        // find mixture id that matches these components (handles both A|B and B|A)
        const mixtureId = this.findMixtureId(componentNames);

        // NOTE: get mixture key
        const mixtureKey = this.matrixData[mixtureId].mixtureKey as BinaryMixtureKey;

        // NOTE: get mixture components
        const components = this.matrixData[mixtureId].components;

        // res
        const res: { [componentPair: string]: number } = {};

        // iterate over all pairs of components in the mixture
        for (let i = 0; i < components.length; i++) {
            for (let j = 0; j < components.length; j++) {
                // component pair
                const component_i = components[i];
                const component_j = components[j];

                // component pair key for res
                // *** component i
                const component_i_id = set_component_id(component_i, mixtureKey);
                // *** component j
                const component_j_id = set_component_id(component_j, mixtureKey);


                // property symbol for this pair of components (e.g. "a_methanol_ethanol" or "a_1_2")
                const propSymbolPair = `${propPrefix}${keyDelimiter}${component_i_id}${keyDelimiter}${component_j_id}`;

                // get property value for this pair of components from the property matrix
                const propValue = this.ij(
                    propSymbolPair,
                    mixtureId,
                    componentKey,
                    keyDelimiter
                )

                // *** create component pair key
                const componentPair_i_id = set_component_id(component_i, componentKey);
                const componentPair_j_id = set_component_id(component_j, componentKey);
                const componentPairKey = `${componentPair_i_id}${keyDelimiter}${componentPair_j_id}`;

                res[componentPairKey] = propValue['value'];
            }
        }

        return res;
    }


    // SECTION: Core matrix builder - builds both numeric and dictionary formats
    /**
     * Core internal method to build matrix data for a given property symbol and components.
     *
     * @param propertySymbol - property symbol such as "Alpha_i_j" or "a_i_j"
     * @param components - ordered list of components to build the matrix from
     * @returns Object containing both numeric matrix and dictionary with matrix property values
     *
     * @throws Error if property symbol or components are empty
     *
     * @internal
     */
    private _buildMatrixData(
        propertySymbol: string,
        components: Component[],
        componentKey: ComponentKey,
        keyDelimiter: string
    ): { numeric: number[][], alphabetic: { [key: string]: number } } {
        try {
            // NOTE: check property symbol
            if (!propertySymbol || propertySymbol.trim() === "") {
                throw new Error("Property symbol is empty!");
            }

            // NOTE: check components
            if (!components || components.length === 0) {
                throw new Error("Components array is empty!");
            }

            // NOTE: parse property symbol to get prefix
            const {
                propertyPrefix: propPrefix,
                propertyDelimiter,
            } = propertyParser(
                propertySymbol,
            )

            // NOTE: create mixture id
            const mixtureKeys = generateMixtureKey(
                components,
                ["Name", "Formula", "Name-Formula"],
                this.mixtureDelimiter
            )

            // >> find mixture key
            const mixtureId = this.findMixtureKey(mixtureKeys);

            // NOTE: get mixture key
            const mixtureKey = this.matrixData[mixtureId].mixtureKey as BinaryMixtureKey;

            // NOTE: get component count
            const componentNum = components.length;

            // NOTE: matrix data (2D array initialized)
            const matIj: number[][] = Array(componentNum)
                .fill(null)
                .map(() => Array(componentNum).fill(0));

            // matrix data dictionary
            const matIjDict: { [key: string]: number } = {};

            // SECTION: iterate over components in order to build matrix
            for (let i = 0; i < componentNum; i++) {
                for (let j = 0; j < componentNum; j++) {
                    const component_i = components[i];
                    const component_j = components[j];

                    // get component ids using the componentKey
                    const componentId_i = set_component_id(component_i, mixtureKey);
                    const componentId_j = set_component_id(component_j, mixtureKey);

                    // create property symbol for this pair of components (e.g. "a_methanol_ethanol" or "a_1_2")
                    const propSymbolPair = `${propPrefix}${propertyDelimiter}${componentId_i}${propertyDelimiter}${componentId_j}`;

                    // get value from property matrix
                    const propMatrix = this.ij(
                        propSymbolPair,
                        mixtureId
                    )

                    // set value in numeric matrix
                    matIj[i][j] = propMatrix['value'] ?? 0;

                    // set value in dictionary with pipe-separated key
                    // *** create component pair key
                    const componentPair_i_id = set_component_id(component_i, componentKey);
                    const componentPair_j_id = set_component_id(component_j, componentKey);
                    const componentPairKey = `${componentPair_i_id}${keyDelimiter}${componentPair_j_id}`;

                    matIjDict[componentPairKey] = propMatrix['value'] ?? 0;
                }
            }

            // NOTE: validate results
            if (!matIj || !matIjDict) {
                throw new Error("Matrix data is null!");
            }

            return {
                numeric: matIj,
                alphabetic: matIjDict
            };
        } catch (e) {
            throw new Error(`Getting matrix data failed! ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    // SECTION: Get 2D numeric matrix
    /**
     * Get 2D numeric array of property values for a given property symbol and components.
     *
     * @param propertySymbol - property symbol such as "Alpha_i_j" or "a_i_j"
     * @param components - ordered list of components to build the matrix from
     * @returns 2D numeric array with matrix property values
     *
     * @throws Error if property symbol or components are empty
     *
     * @example
     * const matrix = data.mat("Alpha_i_j", [component1, component2]);
     * // Returns: [[1.2, 3.4], [5.6, 7.8]]
     */
    mat(
        propertySymbol: string,
        components: Component[],
        componentKey: ComponentKey = "Name-Formula",
        keyDelimiter: string = "_"
    ): number[][] {
        const result = this._buildMatrixData(propertySymbol, components, componentKey, keyDelimiter);
        return result.numeric;
    }

    // SECTION: Get matrix as dictionary
    /**
     * Get dictionary of property values with component-pair keys for a given property symbol and components.
     *
     * @param propertySymbol - property symbol such as "Alpha_i_j" or "a_i_j"
     * @param components - ordered list of components to build the matrix from
     * @returns Dictionary with keys in format "component_name | component_name" and numeric values
     *
     * @throws Error if property symbol or components are empty
     *
     * @example
     * const matrixDict = data.matDict("Alpha_i_j", [component1, component2]);
     * // Returns: { "ethanol | methanol": 1.2, "ethanol | ethanol": 3.4, ... }
     */
    matDict(
        propertySymbol: string,
        components: Component[],
        componentKey: ComponentKey = "Name-Formula",
        keyDelimiter: string = "_"
    ): { [key: string]: number } {
        const result = this._buildMatrixData(propertySymbol, components, componentKey, keyDelimiter);
        return result.alphabetic;
    }
}