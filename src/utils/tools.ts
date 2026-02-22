// import libs

function isNumeric(value: unknown): value is string {
    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        !Number.isNaN(Number(value))
    );
}

function toNumber(value: unknown): number | null {
    if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !Number.isNaN(Number(value))
    ) {
        return Number(value);
    }

    return null;
}