import { numeric } from "drizzle-orm/pg-core";
import { store } from "./Store";
import { DUMPALLAOF } from "./aof";
import { type Obj, OBJ_STRING, OBJ_ENCODING_INT } from "./object";
import { deduceType } from "./typeHelper";
import { assertType, assertEncoding } from "./typeencoding";


type Cmd = {
  cmd: string;
  args: string[];
};

function evalNil() {
  return "$-1\r\n";
}

function integer(value: number): string {
  return `:${value}\r\n`;
}

function err(msg: string): string {
  return `-ERR ${msg}\r\n`;
}

export function encode(value: any, simple: boolean = true): string {
  if (value === null) {
    return evalNil();
  }

  if (Array.isArray(value)) {
    let res = `*${value.length}\r\n`;
    for (const item of value) {
      const strArg = String(item);
      res += `$${strArg.length}\r\n${strArg}\r\n`;
    }
    return res;
  }

  switch (typeof value) {
    case "string":
      return simple ? `+${value}\r\n` : `$${value.length}\r\n${value}\r\n`;
    case "number":
      return `:${value}\r\n`;
    default:
      return evalNil();
  }
}

function evalPing(cmd: Cmd) {
  if (cmd.args.length > 1) {
    return err("wrong number of arguments for 'PING'");
  }

  if (cmd.args.length === 0) {
    return "+PONG\r\n";
  }

  return encode(cmd.args[0], false);
}

function evalSet(cmd: Cmd) {
  if (cmd.args.length < 2) {
    return err("wrong number of arguments for 'set' command");
  }
  const key = cmd.args[0];
  const value = cmd.args[1]!;

  let expiresAt: number | undefined;

  for (let i = 2; i < cmd.args.length; i++) {
    switch (cmd.args[i]?.toUpperCase()) {
      case "EX": {
        if (i + 1 >= cmd.args.length) {
          return err("syntax error");
        }
        const seconds = parseInt(cmd.args[++i]!, 10);
        if (isNaN(seconds) || seconds < 0) {
          return err("invalid expire time in set");
        }
        expiresAt = Date.now() + seconds * 1000;
        break;
      }
      default:
        return err("syntax error");
    }
  }
  let parsedValue: string | number = value;
  const encoding = deduceType(value);
  
  // Try checking if encoding matches INT without type flag
  try {
    assertEncoding(encoding, OBJ_ENCODING_INT);
    parsedValue = parseInt(value, 10);
  } catch {}

  store.put(key!, {
    typeEncoding: encoding,
    value: parsedValue,
    expiresAt
  });
  return encode("OK");
}


function evalGet(cmd: Cmd) {
  if (cmd.args.length !== 1) {
    return err("wrong number of arguments for 'get' command");
  }

  const key = cmd.args[0];
  if (key == null) return integer(0);

  const obj = store.get(key);
  if (!obj) {
    return evalNil();
  }

  return encode(String(obj.value), false);
}

function evalTTL(cmd: Cmd): string {
  if (cmd.args.length !== 1) {
    return err("wrong number of arguments for 'ttl' command");
  }

  const key = cmd.args[0];
  const obj = store.get(key!);

  // missing key
  if (!obj) {
    return integer(-2);
  }

  // no expiration
  if (obj.expiresAt === undefined) {
    return integer(-1);
  }

  const ttl = Math.ceil((obj.expiresAt - Date.now()) / 1000);

  return integer(ttl > 0 ? ttl : -2);
}

function evalDel(cmd: Cmd) {
  if (cmd.args.length == 0)
    return err("unknown number of arguments for 'del' command");
  let countDelete = 0;

  for (let i = 0; i < cmd.args.length; i++) {
    const key = cmd.args[i];
    if (key !== null && store.delete(key!)) {
      countDelete++;
    }
  }
  return integer(countDelete);
}

function evalExpire(cmd: Cmd) {
  if (cmd.args.length !== 2) {
    return err("wrong number of arguments for 'expire' command");
  }

  const key = cmd.args[0];
  const obj = store.get(key!);

  if (!obj) {
    return integer(0);
  }

  // Implementation for setting expiration
  const seconds = Number(cmd.args[1]);
  if (!Number.isInteger(seconds) || seconds < 0) {
    return err("invalid expire time in expire");
  }
  obj.expiresAt = Date.now() + seconds * 1000;
  
  // Re-put to trigger expiration tracking in the Store
  store.put(key!, obj);

  return integer(1);
}

function evalIncr(cmd: Cmd) {
  if (cmd.args.length !== 1) {
    return err("wrong number of arguments for 'incr' command");
  }

  const key = cmd.args[0]!;
  let obj = store.get(key);

  if (!obj) {
    obj = {
      typeEncoding: (OBJ_STRING << 4) | OBJ_ENCODING_INT,
      value: 0
    };
  } else {
    try {
      assertType(obj.typeEncoding, OBJ_STRING << 4);
    } catch {
      return err("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    try {
      assertEncoding(obj.typeEncoding, OBJ_ENCODING_INT);
    } catch {
      if (typeof obj.value === 'string') {
        const parsed = parseInt(obj.value, 10);
        if (isNaN(parsed) || parsed.toString() !== obj.value) {
          return err("ERR value is not an integer or out of range");
        }
        obj.value = parsed;
        obj.typeEncoding = (OBJ_STRING << 4) | OBJ_ENCODING_INT;
      } else {
        return err("ERR value is not an integer or out of range");
      }
    }
  }

  const newValue = (obj.value as number) + 1;
  obj.value = newValue;
  
  store.put(key, obj);

  return integer(newValue);
}

// TODO: Make it async by forking a new process/thread
function evalBGREWRITEAOF() {
  DUMPALLAOF();
  return encode("OK");
}

function evalCommand() {
  // Minimal compatibility for redis-cli ready check.
  return "*0\r\n";
}

function evalInfo() {
  // Minimal INFO payload so redis-cli can complete readiness checks.
  return "$0\r\n\r\n";
}

export function evalAndRespone(cmds: Cmd[]): string {
  let response = "";
  for (const cmd of cmds) {
    switch (cmd.cmd) {
      case "SET":
        response += evalSet(cmd);
        break;
      case "GET":
        response += evalGet(cmd);
        break;
      case "INCR":
        response += evalIncr(cmd);
        break;
      case "PING":
        response += evalPing(cmd);
        break;
      case "TTL":
        response += evalTTL(cmd);
        break;
      case "DEL":
        response += evalDel(cmd);
        break;
      case "EXPIRE":
        response += evalExpire(cmd);
        break;
      case "QUIT":
        response += "+OK\r\n";
        break;
      case "INFO":
        response += evalInfo();
        break;
      case "COMMAND":
        response += evalCommand();
        break;
      case "BGREWRITEAOF":
        response += evalBGREWRITEAOF();
        break;
      default:
        response += err("unknown commands");
    }
  }
  return response;
}

// Del -
// Del K -- return 1 if present
// Again  Del k -- return 0 if nothign exist
// Del k1 k2 k3 k4 - reutnr 2 if only two keys exist

// Expire
// Expire K 10 --> 1
// Expire Ad -- > unknown arguemtns
// Expire k 34 --> (if k key not present) - return 0