
const PORT = 3000;
const KeysLimit = 20;

const evictionRate = 0.25; // 25% of the sampled keys

export type EvictionStrategy = "allkeys-lru" | "volatile-lru" | "allkeys-random" | "volatile-random" | "noeviction" | "eviction-first";
const evictionStrategy : EvictionStrategy = "allkeys-random"; // Eviction strategy: allkeys-lru, volatile-lru, allkeys-random, volatile-random, noeviction

const AOFFile = "appendonly.aof";

export { PORT, KeysLimit, evictionRate, evictionStrategy, AOFFile };