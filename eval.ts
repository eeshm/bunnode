type Cmd = {
  cmd: string;
  args: string[];
};

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
