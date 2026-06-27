import { Key_Limit } from "./constants";
import { type Obj } from "./object";
import { UpdateDBStat } from "./stats";
import { evict } from "./evict";

class Storage {
  private data = new Map<string, Obj>();
  private expires = new Set<string>();

  put(key: string, item: Obj) {
    this.data.set(key, item);
    if (this.data.size >= Key_Limit) {
      evict();
    }
    UpdateDBStat(0, "keys", this.data.size); // Update keyspace stats for DB 0
    console.log(`Put key: ${key}, total keys: ${this.data.size}`);

    if (item.expiresAt !== undefined) {
      this.expires.add(key);
    } else {
      this.expires.delete(key);
    }
  }

  get(key: string): Obj | undefined {
    // implement lazy expiration
    const obj = this.data.get(key);
    if (!obj) return undefined;
    if (obj.expiresAt !== undefined && Date.now() >= obj.expiresAt) {
      this.data.delete(key);
      this.expires.delete(key);
      return undefined;
    }
    return obj;
  }
  delete(key: string) {
    const existed = this.data.delete(key);
    this.expires.delete(key);

    if (existed) {
      UpdateDBStat(0, "keys", this.data.size);
    }

    return existed;
  }
  // Get keys to sample. (A simpler approach for sampling active expirations in TS)
  getExpiringRandomKeys(limit: number): string[] {
    const keys = Array.from(this.expires);
    const sampled: string[] = [];
    if (keys.length === 0) return sampled;

    for (let i = 0; i < limit; i++) {
      // Pick random key
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (randomKey && !sampled.includes(randomKey)) {
        sampled.push(randomKey);
      }
      if (sampled.length === keys.length) break;
    }
    return sampled;
  }

  getAllKeys():string[]{
    return Array.from(this.data.keys());
  }
  // Allow iterating over the underlying map
  entries() {
    return this.data.entries();
  }
}

export const store = new Storage();
