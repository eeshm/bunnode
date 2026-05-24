# Redis Implementation Notes: Types, Encodings, and INCR

This document outlines the internal changes we made to mimic native Redis object encodings. These changes provide better memory efficiency and much faster performance for mathematical commands.

## 1. Object Representation (`redis/object.ts`)
We defined variables to distinguish between what an object *is* and *how* it's stored in RAM:
- **Types:** `OBJ_STRING` (0) broadly represents the top-level String data structure.
- **Encodings:** `OBJ_ENCODING_RAW` (0 for long strings), `OBJ_ENCODING_INT` (1 for numbers), `OBJ_ENCODING_EMBSTR` (2 for short strings <= 44 bytes).
- **The `Obj` interface:** The `typeEncoding` property is now a bitmask integer instead of a basic string format.
- **Why?** Native Redis uses a single byte inside its `redisObject` C-struct to store **Type** (upper 4 bits) and **Encoding** (lower 4 bits). Storing this state together is space-efficient.

## 2. Bitwise Logic & Deductions (`redis/typeencoding.ts` & `redis/typeHelper.ts`)
- **`deduceType(value)`:** Whenever data comes in, this inspects the string. If it's just characters, it chooses `RAW/EMBSTR`. If it parses perfectly to a number, it tags it as `INT`. It combines the Type and Encoding via bit-shifting: `(OBJ_STRING << 4) | Encoding`.
- **Assertions:** `assertType` and `assertEncoding` use bitwise operators (like `& 0b11110000`) to quickly extract and verify the upper or lower halves of the flag.

## 3. Optimizing `SET` (`redis/eval.ts`)
- Previously, `SET key "100"` stored the characters `"1"`, `"0"`, `"0"`.
- Now, `SET` uses `deduceType()`. If the encoding evaluates to `INT`, we run `parseInt()` in `SET` naturally and store the actual underlying TypeScript `number` inside the Store.
- **Why?** A native 64-bit float/integer consumes less memory pointer overhead than character string chains, especially at large scales.

## 4. The Flow of `INCR` (`redis/eval.ts`)
The `INCR` command relies heavily on the aforementioned upgrades to run instantly without string manipulations.
- **Step 1 (Existence):** If the key doesn't exist, we immediately generate an Object with native number `0`, encoding `INT`, and type `STRING`.
- **Step 2 (Type Check):** It calls `assertType()`. If a user tries to `INCR` something that is a List or a Hash, it throws a generic Redis `WRONGTYPE` error.
- **Step 3 (The Fast Path):** It calls `assertEncoding()` looking for `INT`. If successful, the code does **zero conversions**. It just takes `obj.value + 1` mathematically because `SET` already converted it.
- **Step 4 (The Slow Path / Upgrade):** If it is NOT an `INT` (e.g. they set a raw string that happens to be numbers), it catches the assertion failure, runs `parseInt` exactly **one time**, does the math, and permanently modifies the Store object to an `INT` encoding. Future `INCR` calls will hit the fast path.