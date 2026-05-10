import { Decode } from "./resp";
import net from "net";
import { evalAndRespone } from "./eval";
import { store } from "./Store";
import { startActiveExpiration } from "./expire";

export type Cmd = {
  cmd: string;
  args: string[];
};

type ParsedCmds = {
  cmds: Cmd[];
  nextPos: number;
};

// Start the background active expiration job
startActiveExpiration();

function readCommands(data: string): ParsedCmds | null {
  if (!data || data.length === 0) {
    return null;
  }

  // Support inline Redis protocol (fallback for simple raw commands): "PING\r\n"
  if (data[0] !== "*") {
    const lineEnd = data.indexOf("\r\n");
    if (lineEnd === -1) return null;

    const line = data.slice(0, lineEnd).trim();
    if (!line) return null;
    const parts = line.split(/\s+/);
    const baseCmd = parts[0];
    if (!baseCmd) return null;
    return {
      cmds: [{
        cmd: baseCmd.toUpperCase(),
        args: parts.slice(1),
      }],
      nextPos: lineEnd + 2,
    };
  }

  // Use the pipelined Decode function to get all pipelined commands
  const [values, nextPos] = Decode(data) as [any[], number];
  if (!values || values.length === 0) {
    return null; // incomplete
  }

  const cmds: Cmd[] = [];
  for (const value of values) {
    if (!Array.isArray(value)) continue;

    cmds.push({
      cmd: value[0].toUpperCase(),
      args: value.slice(1),
    });
  }

  return {
    cmds,
    nextPos
  };
}

function respondError() {
  return "-ERR error in response\r\n";
}

function respond(cmds: Cmd[]) {
  const answer = evalAndRespone(cmds);
  if (!answer) {
    return respondError(); // (fallback)
  }
  return answer;
}

export const server = net.createServer((socket) => {
  console.log("client connected");

  let buffer = "";
  socket.on("data", (chunk) => {
    buffer += chunk.toString();

    while (buffer.length > 0) {
      try {
        const parsed = readCommands(buffer);
        if (!parsed) return;

        const response = respond(parsed.cmds);
        socket.write(response);
        
        if (parsed.cmds.some(c => c.cmd === "QUIT")) {
          socket.end();
          return;
        }

        buffer = buffer.slice(parsed.nextPos);
      } catch (errr) {
        socket.write("-ERR parsing error\r\n");
        buffer = "";
        return;
      }
    }
  });

  socket.on("close", () => {
    console.log("Client Disconnected");
  });

  socket.on("error", (err) => {
    console.log("socket error", err.message);
  });
});

// Get the request / data from source like redis clli
// Read command parse into two parts (cmd, args)
// Send the cmd object to eval function
// in eval we first switch the condition based on cmd.cmd (ping or set/get)
// if it is ping we send it to evalPing and it checks the number of args if >=2 return error
// else if args is 0 encode ("PONG") and return else encode the arguement and return
// get the parse in main tcp server and write back
