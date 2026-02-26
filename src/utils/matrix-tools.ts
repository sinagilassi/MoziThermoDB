// import libs

import { type Component, type ComponentKey, set_component_id } from "mozithermodb-settings";

// NOTE: property parser types
export type PropertyParser = {
    propertyPrefix: string;
    propertyDelimiter: string;
    i: string;
    j: string;
    mode: "numeric" | "component";
}


/**
 * Parses a property symbol to extract the property prefix, delimiter, and component indices.
 * @param propertySymbol - the property symbol to parse
 * @param propertyDelimiter - an array of possible delimiters to split the property symbol (default: ["|", "_"])
 * @returns an object containing the property prefix, delimiter, and component indices (i and j)
 *
 * Notes:
 * - The property symbol can be in one of the following formats:
 * 1- "a_i_j | component1 | component2"
 * 2- "a | component1 | component2"
 * 3- "a_component1_component2"
 */
export const propertyParser = (
    propertySymbol: string,
    propertyDelimiters: string[] = ["|", "_"]
): PropertyParser => {
    // res initialization
    const res: PropertyParser = {
        propertyPrefix: "",
        propertyDelimiter: "",
        i: "",
        j: "",
        mode: "component"
    }

    const delimiters = propertyDelimiters.filter(Boolean);

    // Trim the input
    const trimmed = propertySymbol.trim();

    const mainDelimiter = delimiters.find(delimiter => trimmed.includes(delimiter));

    if (!mainDelimiter) {
        res.propertyPrefix = trimmed;
        return res;
    }

    res.propertyDelimiter = mainDelimiter;

    // Split using the main delimiter and get the property token (first token before components)
    const parts = trimmed.split(mainDelimiter).map(p => p.trim());
    const propertyPart = parts[0] || "";

    const nestedDelimiter = delimiters.find(
        delimiter => delimiter !== mainDelimiter && propertyPart.includes(delimiter)
    );

    // Case: mixed delimiters (e.g. "a_i_j | comp1 | comp2")
    if (nestedDelimiter) {
        const subParts = propertyPart.split(nestedDelimiter).map(p => p.trim());
        res.propertyPrefix = subParts[0] || "";
        res.i = subParts[1] || "";
        res.j = subParts[2] || "";
        if (res.i && res.j) {
            res.mode = !isNaN(Number(res.i)) && !isNaN(Number(res.j)) ? "numeric" : "component";
        }
        return res;
    }

    // Case: property prefix with external components (e.g. "a | comp1 | comp2")
    if (delimiters.indexOf(mainDelimiter) === 0 && delimiters.length > 1) {
        res.propertyPrefix = propertyPart;
        return res;
    }

    // Case: single delimiter format (e.g. "a_comp1_comp2")
    const directParts = trimmed.split(mainDelimiter).map(p => p.trim());
    res.propertyPrefix = directParts[0] || "";
    res.i = directParts[1] || "";
    res.j = directParts[2] || "";
    if (res.i && res.j) {
        res.mode = !isNaN(Number(res.i)) && !isNaN(Number(res.j)) ? "numeric" : "component";
    }

    return res;
}

/**
 * Generates a mixture property name in the format:
 * `${property}${propertyDelimiter}${component_i}${propertyDelimiter}${component_j}`.
 * Returns `null` if component id generation fails.
 *
 * @param property Base property name (e.g. `Aij`).
 * @param i First component.
 * @param j Second component.
 * @param componentKey Component key used to resolve component ids.
 * @param propertyDelimiter Delimiter used between property and component ids.
 * @returns Generated mixture property name, or `null` on error.
 */
export const generateMixturePropertyKey = (
    property: string,
    i: Component,
    j: Component,
    componentKey: ComponentKey,
    propertyDelimiter = "_"
): string => {
    try {
        // NOTE: component ids
        const component_i = set_component_id(i, componentKey);
        const component_j = set_component_id(j, componentKey);

        // NOTE: create property id
        const propertyId = `${property}${propertyDelimiter}${component_i}${propertyDelimiter}${component_j}`;

        return propertyId;
    } catch {
        return 'null';
    }
}

