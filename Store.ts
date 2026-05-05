export type StoreItem = {
  value: string;
  expiresAt?: number;
};
import { Key_Limit } from "./constants";

class Storage {
  private data = new Map<string, StoreItem>();
  private expires = new Set<string>();

  put(key: string, item: StoreItem) {
    this.data.set(key, item);
    if(this.data.size >= Key_Limit) {
      this.evict();
    }
    console.log(`Put key: ${key}, total keys: ${this.data.size}`);
      
    if (item.expiresAt !== undefined) {
      this.expires.add(key);
    } else {
      this.expires.delete(key);
    }
  }
 
  get(key: string): StoreItem | undefined {
    // implement lazy expiration
    const obj = this.data.get(key);
    if (!obj) return undefined;
    if (obj.expiresAt !== undefined && Date.now() >= obj.expiresAt) {
      this.data.delete(key);
      this.expires.delete(key);
      return undefined;
    }
    return this.data.get(key);
  }

  delete(key: string) {
    this.expires.delete(key);
    return this.data.delete(key);
  }

  // Get keys to sample. (A simpler approach for sampling active expirations in TS)
  getRandomKeys(limit: number): string[] {
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

  evict() {
    // evict first key (for simplicity, can be improved with LRU or other strategies)
    const firstKey = this.data.keys().next().value;
    this.data.delete(firstKey!);
    this.expires.delete(firstKey!);
  }
}

export const store = new Storage();