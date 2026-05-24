export const OBJ_ENCODING_RAW = 0;
export const OBJ_ENCODING_INT = 1;
export const OBJ_ENCODING_EMBSTR = 2;

export type Obj = {
    typeEncoding: number; // 0 for raw, 1 for int, 2 for embstr
    value: string | number;
    expiresAt?: number;
};



