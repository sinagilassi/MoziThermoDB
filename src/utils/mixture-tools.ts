// import libs
import { BinaryMixtureKey, type Component, type ComponentKey, set_component_id } from "mozithermodb-settings";

/**
 * Generates a unique mixture ID based on the component IDs and a specified delimiter.
 * @param componentId_1 Component ID of the first component depending on the mixture key (e.g. "methanol" or "CH3OH" or "methanol-CH3OH").
 * @param componentId_2 Component ID of the second component depending on the mixture key (e.g. "ethanol" or "C2H5OH" or "ethanol-C2H5OH").
 * @param delimiter Delimiter used to join component IDs (e.g. "|").
 * @returns Generated mixture ID (e.g. "methanol|ethanol" or "CH3OH|C2H5OH" or "methanol-CH3OH|ethanol-C2H5OH").
 */
export const generateMixtureId = (componentId_1: string, componentId_2: string, delimiter: string): string => {
    const componentIds = [componentId_1, componentId_2]
    return componentIds.join(delimiter);
}

export const generateMixtureIds = (
    components: Component[],
    mixtureKey: BinaryMixtureKey,
    delimiter: string
): string[] => {
    const componentIds = components.map(component => set_component_id(component, mixtureKey));
    const mixtureId1 = generateMixtureId(componentIds[0], componentIds[1], delimiter);
    const mixtureId2 = generateMixtureId(componentIds[1], componentIds[0], delimiter);
    return [mixtureId1, mixtureId2];
}

export const findMixtureComponent = (
    componentId: string,
    components: Component[],
    componentKey: ComponentKey[] = ["Name", "Formula", "Name-Formula"]
): Component | null => {
    for (const key of componentKey) {
        const found = components.find(component => set_component_id(component, key).toLowerCase() === componentId.toLowerCase());
        if (found) {
            return found;
        }
    }
    return null;
}

export const generateMixtureKey = (
    components: Component[],
    mixtureKeys: BinaryMixtureKey[] = ["Name", "Formula", "Name-Formula"],
    mixtureDelimiter = "|"
) => {
    // mixture keys
    const mixKeys: string[] = [];

    // iterate over mixture keys and generate mixture ids
    for (const mixtureKey of mixtureKeys) {
        try {
            const mixtureIds = generateMixtureIds(components, mixtureKey, mixtureDelimiter);
            mixKeys.push(...mixtureIds)
        }
        catch (error) {
        }
    }

    // >> check
    if (mixKeys.length === 0) {
        throw new Error(`Failed to generate mixture key for components '${components.map(c => c.name).join(", ")}'.`);
    }

    // remove duplicates
    const uniqueMixKeys = Array.from(new Set(mixKeys));

    // res
    return uniqueMixKeys;

}

// SECTION: Find Mixture Key from Mixture ID and only one component
export const findMixtureKey = (
    mixtureId: string,
    component: Component,
    mixtureKeys: BinaryMixtureKey[] = ["Name", "Formula", "Name-Formula"],
    mixtureDelimiter = "|"
): BinaryMixtureKey => {
    // NOTE: component ids
    const componentIds = mixtureId.split(mixtureDelimiter).map(id => id.trim().toLowerCase());

    // iterate over mixture keys and check if component id matches
    for (const mixtureKey of mixtureKeys) {
        const componentId = set_component_id(component, mixtureKey).toLowerCase();

        // compare
        if (componentIds.includes(componentId)) {
            return mixtureKey;
        }
    }
    throw new Error(`Failed to find mixture key for mixture ID '${mixtureId}' and component '${component.name}'.`);
}

// SECTION: Find Mixture key from Mixture ID with both components
export const findMixtureKeyFromComponents = (
    mixtureId: string,
    components: Component[],
    mixtureKeys: BinaryMixtureKey[] = ["Name", "Formula", "Name-Formula"],
    mixtureDelimiter = "|"
): BinaryMixtureKey => {
    // NOTE: component ids
    const componentIds = mixtureId.split(mixtureDelimiter).map(id => id.trim().toLowerCase());
    // iterate over mixture keys and check if both component ids match
    for (const mixtureKey of mixtureKeys) {
        const componentId_1 = set_component_id(components[0], mixtureKey).toLowerCase();
        const componentId_2 = set_component_id(components[1], mixtureKey).toLowerCase();
        // compare
        if (componentIds.includes(componentId_1) && componentIds.includes(componentId_2)) {
            return mixtureKey;
        }
    }
    throw new Error(`Failed to find mixture key for mixture ID '${mixtureId}' and components '${components.map(c => c.name).join(", ")}'.`);

}