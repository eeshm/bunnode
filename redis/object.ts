export type Obj = {
    typeEncoding? : Uint8Array;
    value: string;
    expiresAt?: number;
};

const OBJ_TYPE_STRING = 0 << 4;

const OBJ_ENCODING_RAW = 0;
const OBJ_ENCODING_INT = 1;
const OBJ_ENCODING_EMBSTR = 2;



