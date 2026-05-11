import {AOFFile} from "./config";
import fs from "fs";
import { store } from "./Store";
import { encode } from "./eval";

function dumpKey(fstream: fs.WriteStream, key: string, obj: any) {
  // obj contains { value, expiresAt }
  const cmd = ["SET", key, obj.value];
  
  if (obj.expiresAt) {
      const ttlSeconds = Math.max(0, Math.ceil((obj.expiresAt - Date.now()) / 1000));
      cmd.push("EX", ttlSeconds.toString());
  }
  
  const encodedCmd = encode(cmd);
  fstream.write(encodedCmd);
}

// open file in write only mode and append mode
export function DUMPALLAOF() {
    // Truncate or rewrite the whole AOF using write mode for dumping.
    // To strictly support AOF, it should probably clear and write all commands.
    const aof = fs.createWriteStream(AOFFile, { flags: "w" });
    console.log("Dumping AOF...");
    for (const [key, value] of store.entries()) {
      dumpKey(aof, key, value);
    }
    aof.end();
    console.log("End")
}