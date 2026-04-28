export type StoreItem = {
  value: string;
  expiresAt?: number;
};

class Storage {
  private data = new Map<string, StoreItem>();

  put(key: string, item: StoreItem) {
    this.data.set(key, item);
  }

  get(key: string): StoreItem | undefined {
    return this.data.get(key);
  }

  delete(key: string) {
    this.data.delete(key);
  }
}

export const store = new Storage();