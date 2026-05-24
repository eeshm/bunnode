import { OBJ_ENCODING_INT, OBJ_ENCODING_EMBSTR, OBJ_ENCODING_RAW } from "./object";

export function deduceType(value: string | number): number {
    if (typeof value === 'number') return OBJ_ENCODING_INT;
    
    const intValue = parseInt(value, 10);
    // Check if it's a valid integer entirely represented by its string equivalent
    if (!isNaN(intValue) && intValue.toString() === value) {
        return OBJ_ENCODING_INT;
    } 
    // Embedded strings typically take up to 44 bytes in Redis representation
    else if (value.length <= 44) {
        return OBJ_ENCODING_EMBSTR;
    } 
    // Otherwise fallback to raw string allocation
    return OBJ_ENCODING_RAW;
}
