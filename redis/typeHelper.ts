import { OBJ_STRING, OBJ_ENCODING_INT, OBJ_ENCODING_EMBSTR, OBJ_ENCODING_RAW } from "./object";

export function deduceType(value: string | number): number {
    const baseType = OBJ_STRING << 4;
    
    if (typeof value === 'number') return baseType | OBJ_ENCODING_INT;
    
    const intValue = parseInt(value, 10);
    // Check if it's a valid integer entirely represented by its string equivalent
    if (!isNaN(intValue) && intValue.toString() === value) {
        return baseType | OBJ_ENCODING_INT;
    } 
    // Embedded strings typically take up to 44 bytes in Redis representation
    else if (value.length <= 44) {
        return baseType | OBJ_ENCODING_EMBSTR;
    } 
    // Otherwise fallback to raw string allocation
    return baseType | OBJ_ENCODING_RAW;
}




// The recent changes introduced a foundational optimization used natively by Redis, often called "Object Encodings", along with the `INCR` command.

// Here is a breakdown of what changed, how it differs from before, and why it was necessary:

// ### 1. The `deduceType` Function (in `typeHelper.ts`)
// **What changed:** We created a new helper file/function that analyzes an incoming value and categorizes it into one of three constants: `OBJ_ENCODING_RAW` (0), `OBJ_ENCODING_INT` (1), or `OBJ_ENCODING_EMBSTR` (2).
// **How it differs:** Previously, all values were naively dumped into the `Obj` store as plain strings, regardless of what they represented.
// **Why it's needed:** Separation of concerns. By exposing this as a helper, any command (like `SET` or `INCR`) can easily evaluate what type of raw bytes they are looking at without duplicating complex String/Number regex or length-checking (e.g. `<= 44` bytes).

// ### 2. Upgrading `evalSet` (in eval.ts)
// **What changed:** When you call `SET key value`, the code now passes the value through `deduceType`. If it determines the string is just a number (like `"123"`), it parses it into a native TypeScript `number` and saves it with `typeEncoding: OBJ_ENCODING_INT`.
// **How it differs:** Before, `SET visits "100"` would store the raw characters `"1", "0", "0"`. Now, it stores the actual integer `100` alongside an encoding flag.
// **Why it's needed:** Memory efficiency. In native Redis, storing small integers as actual 64-bit hardware integers instead of strings avoids unnecessary memory allocations and pointer overhead. The same goes for strings smaller than 44 bytes (`EMBSTR`), which Redis packs directly next to the object header in memory.

// ### 3. Implementing `evalIncr` (in eval.ts)
// **What changed:** We added full support for the `INCR` command, which allows atomic iteration of number values.
// **How it differs:** This command didn't exist before. The code we wrote specifically looks at the `typeEncoding` flag on the stored `Obj`:
//    - If the key doesn't exist, it handles it safely by starting at `0` and incrementing to `1`.
//    - If it does exist, it respects the encoding. It verifies it's an `INT`, increments the native number, and places it back in the store.
//    - If a user tries to run `INCR` on a non-number (e.g. `SET name "John"` -> `INCR name`), it correctly aborts and returns an error exactly like native Redis (`"ERR value is not an integer or out of range"`).
// **Why it's needed:** `INCR` is one of the most widely used commands in Redis for things like page views, rate limiters, and distributed counters. Building it *after* updating the types was necessary so `INCR` didn't have to endlessly parse strings to integers back and forth. Since `SET` now stores an `INT` natively, `INCR` operates with high performance by just doing native math.