
const PORT = 3000;
const keysLimit = 20;

const evictionRate = 0.25; // 25% of the sampled keys

const evictionStrategy = "allkeys-random"; // Eviction strategy: allkeys-lru, volatile-lru, allkeys-random, volatile-random, noeviction

const AOFFile = "appendonly.aof";

export { PORT, keysLimit, evictionRate, evictionStrategy, AOFFile };