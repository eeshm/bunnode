import { store } from "./Store";    

function DeleteExpiredKeys() {
    for (const [key, value] of store.data) {
        if (value.expiresAt !== undefined && Date.now() >= value.expiresAt) {
            store.delete(key);
        }
    }
}
