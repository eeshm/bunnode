export type StoreItem = {
  value: string;
  expiresAt?: number;
};

class Storage {
  private data = new Map<string, StoreItem>();
  private expires = new Set<string>();

  put(key: string, item: StoreItem) {
    this.data.set(key, item);
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
}

export const store = new Storage();