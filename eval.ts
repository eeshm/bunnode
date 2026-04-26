type Cmd = {
  cmd: string;
  args: string[];
};

let map = new Map();

function encode(value: any, simple: boolean = true) {
  if (typeof value == "string") {
    return simple ? `+${value}\r\n` : `$${value.length}\r\n${value}\r\n`;
  }

  if (value === null) return "$-1\r\n";

  return `:${value}\r\n`;
}

function evalPing(cmd: Cmd) {
  if (cmd.args.length >= 2) {
    return "-ERR wrong number of arguments for 'PING'\r\n";
  } else if (cmd.args.length == 0) {
    return encode("PONG", true);
  } else {
    return encode(cmd.args[0], false);
  }
}
function set(data: any) {
  try {
    map.set(data[0], data[1]);
    return true;
  } catch (err) {
    return false;
  }
}

function evalSet(cmd: Cmd) {
  if (cmd.args.length > 2) {
    return "-ERR syntax error\r\n";
  } else if (cmd.args.length < 2) {
    return "-ERR wrong number of arguments for 'set' command\r\n";
  } else {
    const result = set(cmd.args);
    if (!result) {
      return "-ERR unkwone error\r\n";
    }
    return encode("OK", true);
  }
}

function get(data: any) {
  try {
    const result = map.get(data[0]);
    return result;
  } catch {
    return null;
  }
}

function evalGet(cmd: Cmd) {
  if (cmd.args.length !== 1) {
    return "-ERR wrong number of arguments for 'get' command\r\n";
  } else {
    const result = get(cmd.args);
    if (!result) {
      return encode("(nil)", true);
    } else {
      return encode(result, true);
    }
  }
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
