import { DecodeOne } from "./resp";
import net from "net"
import { evalAndRespone } from "./eval";
import { createServer } from "http";

export type Cmd = {
    cmd : string
    args : string[];
}

type ParsedCmd = {
    cmd: Cmd;
    nextPos: number;
};


function readCommand(data:string) :ParsedCmd | null{
    if(!data || data.length == 0){
        return null;
    }

    // Support inline Redis protocol: "PING\r\n" or "PING hello\r\n"
    if (data[0] !== "*") {
        const lineEnd = data.indexOf("\r\n");
        if (lineEnd === -1) return null;

        const line = data.slice(0, lineEnd).trim();
        if (!line) return null;
        const parts = line.split(/\s+/);
        const baseCmd = parts[0];
        if (!baseCmd) return null;
        return {
            cmd: {
                cmd: baseCmd.toUpperCase(),
                args: parts.slice(1)
            },
            nextPos: lineEnd + 2
        };
    }

    let value: any;
    let nextPos: number;
    try {
        [value,nextPos] =DecodeOne(data,0);
    } catch {
        // Incomplete RESP frame; wait for more bytes.
        return null;
    }

    if(!Array.isArray(value)) return null;

    return {
        cmd: {
            cmd: value[0].toUpperCase(),
            args :value.slice(1)
        },
        nextPos
    }
}

function respondError(){
    return "-ERR error in response\r\n"
}

function respond(cmd :any){
    const answer =  evalAndRespone(cmd);
    if(!answer){
        return respondError();
    }
    return answer;
}

export const server = net.createServer((socket)=>{
    console.log("client connected");
    
    let buffer ="";
    socket.on("data", (chunk)=>{
        buffer += chunk.toString();

        while (buffer.length > 0) {
            try{
                const parsed = readCommand(buffer);
                if(!parsed) return;

                const cmd = parsed.cmd;
                const response = respond(cmd);
                socket.write(response);
                if (cmd.cmd === "QUIT") {
                    socket.end();
                    return;
                }

                buffer = buffer.slice(parsed.nextPos);
            }catch(errr){
                socket.write("-ERR parsing error\r\n");
                buffer = "";
                return;
            }
        }
    })

    socket.on("close",()=>{
        console.log("Client Disconnected")
    })

    socket.on("error",(err)=>{
        console.log("socket error", err.message)
    })
})


// Get the request / data from source like redis clli 
// Read command parse into two parts (cmd, args)
// Send the cmd object to eval function
// in eval we first switch the condition based on cmd.cmd (ping or set/get)
// if it is ping we send it to evalPing and it checks the number of args if >=2 return error
// else if args is 0 encode ("PONG") and return else encode the arguement and return
// get the parse in main tcp server and write back 
