// we need 4 keyspaceStats
export const KeyspaceStats  : Map<string, number>[] = Array.from(
  { length: 4 },
  () => new Map<string, number>(),
);

export function UpdateDBStat(num: number, key: string, value: number) {
  if (num < 0 || num >= KeyspaceStats.length) {
    throw new Error(`Invalid DB number: ${num}`);
  }
  KeyspaceStats[num]!.set(key, value);
}