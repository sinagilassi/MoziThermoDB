// import libs


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
    propertyDelimiter: string[] = ["|", "_"]
) => {
    // res initialization
    const res = {
        propertyPrefix: "",
        propertyDelimiter: "",
        i: "",
        j: ""
    }

    // Trim the input
    const trimmed = propertySymbol.trim();

    // Check if pipe delimiter exists (cases 1 & 2)
    if (trimmed.includes("|")) {
        res.propertyDelimiter = "|";

        // Split by "|" and get the property part (first element before components)
        const parts = trimmed.split("|").map(p => p.trim());
        const propertyPart = parts[0];

        // Parse the property part which might contain underscores (case 1)
        if (propertyPart.includes("_")) {
            const subParts = propertyPart.split("_").map(p => p.trim());
            res.propertyPrefix = subParts[0];
            res.i = subParts[1] || "";
            res.j = subParts[2] || "";
        } else {
            // Case 2: just property prefix with pipe-delimited components
            res.propertyPrefix = propertyPart;
        }
    } else {
        // Case 3: underscore-delimited format "a_component1_component2"
        res.propertyDelimiter = "_";
        const parts = trimmed.split("_").map(p => p.trim());
        res.propertyPrefix = parts[0];
        res.i = parts[1] || "";
        res.j = parts[2] || "";
    }

    return res;
}