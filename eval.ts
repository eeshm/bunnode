type Cmd = {
  cmd: string;
  args: string[];
};

let map = new Map<string, string>();

function encode(value: any, simple: boolean = true) {
  if (typeof value == "string") {
    return simple ? `+${value}\r\n` : `$${value.length}\r\n${value}\r\n`;
  }

  if (value === null) return "$-1\r\n";

  return `:${value}\r\n`;
}

function evalPing(cmd: Cmd) {
  if (cmd.args.length > 1) {
    return "-ERR wrong number of arguments for 'PING'\r\n";
  }

  if (cmd.args.length === 0) {
    return "+PONG\r\n";
  }

  return encode(cmd.args[0], false);
}

function evalSet(cmd: Cmd) {
  if (cmd.args.length !== 2) {
    return "-ERR wrong number of arguments for 'set' command\r\n";
  }
  let exDurationMs = -1;

  let key = cmd.args[0];
  let value = cmd.args[1];
  for (let i = 2; i < cmd.args.length; i++) {
    switch (cmd.args[i]) {
      case "Ex","ex" :
        return "hi"
    }
  }
  return "+OK\r\n";
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
  }
  const result = map.get(cmd.args[0]!);

  if (result === undefined) {
    return "$-1\r\n";
  }

  return encode(result, false);
}

function evalTTl(cmd: Cmd) {}

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
