import { store } from "./Store";

function expireSample() {
  const limit = 20;

  while (true) {
    const keys = store.getRandomKeys(limit);
    if (keys.length === 0) {
      break;
    }

    let expiredCount = 0;

    for (const key of keys) {
      // By calling store.get(), lazy expiration triggers automatically
      // and evicts the key if it has expired.
      const item = store.get(key);
      if (item === undefined) {
        expiredCount++;
      }
    }

    // If less than 25% of the sampled keys were expired, we stop the loop.
    // Otherwise, we loop again to aggressively delete more expired keys.
    if (expiredCount / keys.length <= 0.25) {
      break;
    }
  }
}

export function startActiveExpiration() {
  setInterval(() => {
    expireSample();
  }, 1000); // Runs every 1 second
}

