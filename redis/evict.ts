import {evictionRate,evictionStrategy,KeysLimit} from "./config";
import { store } from "./Store";

function evictFirst(){
    const keys = store.getAllKeys();
    if (keys.length === 0) {
        return;
    }
    const key = keys[0];
    store.delete(key!);
}

function evictAllKeysRandom(){
    const keys = store.getAllKeys();
    const evictCount = Math.min(evictionRate * KeysLimit, keys.length);
 

    for (let i = 0; i < evictCount; i++) {
        const idx = Math.floor(Math.random() * keys.length);
        const key = keys[idx];

        store.delete(key!);
        keys.splice(idx, 1);
    }
}   


export function evict(){
    switch(evictionStrategy){
        case "allkeys-random":
            evictAllKeysRandom();
            break;
        case "eviction-first":
            evictFirst();
            break;
        default:
            console.warn(`Unknown eviction strategy: ${evictionStrategy}`);
            break;
    }
}


//TODO: 
// maintain keysArray
// do O(1) swap-delete
// O(1) random access