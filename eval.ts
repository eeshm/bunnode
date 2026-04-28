import { store } from "./store";

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

function encode(value: any, simple: boolean = true) {
  if (typeof value == "string") {
    return simple ? `+${value}\r\n` : `$${value.length}\r\n${value}\r\n`;
  }

  if (value === null) return evalNil();

  return `:${value}\r\n`;
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
  const value = cmd.args[1];

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
  store.put(key!, {
    value,
    expiresAt,
  });
  return encode("OK");
}

function evalGet(cmd: Cmd) {
  if (cmd.args.length !== 1) {
    return err("wrong number of arguments for 'get' command");
  }

  const key = cmd.args[0];
  const obj = store.get(key!);

  if (!obj) {
    return evalNil;
  }

  // lazy expiration
  if (obj.expiresAt !== undefined && Date.now() >= obj.expiresAt) {
    store.delete(key!);
    return evalNil();
  }

  return encode(obj.value, false);
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

  if (ttl <= 0) {
    store.delete(key!);
    return integer(-2);
  }

  return integer(ttl);
}
function evalCommand() {
  // Minimal compatibility for redis-cli ready check.
  return "*0\r\n";
}

function evalInfo() {
  // Minimal INFO payload so redis-cli can complete readiness checks.
  return "$0\r\n\r\n";
}

export function evalAndRespone(cmd: Cmd): string {
  switch (cmd.cmd) {
    case "SET":
      return evalSet(cmd);
    case "GET":
      return evalGet(cmd);
    case "PING":
      return evalPing(cmd);
    case "TTL":
      return evalTTl(cmd);
    case "QUIT":
      return "+OK\r\n";
    case "INFO":
      return evalInfo();
    case "COMMAND":
      return evalCommand();
    default:
      return "-ERR unknown command\r\n";
  }
}
