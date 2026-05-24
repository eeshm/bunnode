
export function getType(flags: number): number {
  return flags & 0b11110000; // upper 4 bits for type
}

export function getEncoding(flags: number): number {
    return flags & 0b00001111; // lower 4 bits for encodings
}

export function assertType(
  flags: number,
  expectedType: number
) {
  if (getType(flags) !== expectedType) {
    throw new Error("Invalid object type");
  };
}

export function assertEncoding(
  flags: number,
  expectedEncoding: number
) {
  if (getEncoding(flags) !== expectedEncoding) {
    throw new Error("Invalid encoding");
  }
}