import { DecodeOne } from "./resp";
import net from "net"
import { evalAndRespone } from "./eval";

export type Cmd = {
    cmd : string
    args : string[];
}


function readCommand(data:string) :Cmd | null{
    if(!data || data.length == 0){
        return null;
    }

    const [value,nextPos] =DecodeOne(data,0);
    if(!Array.isArray(value)) return null;

    return {
        cmd: value[0].toUpperCase(),
        args :value.slice(1)
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

        try{
            const cmd = readCommand(buffer);
            if(!cmd) return;
            const response = respond(cmd);
            socket.write(response);
            if (cmd.cmd === "QUIT") {
                socket.end();
                return;
            }

            const [_,nextPos] = DecodeOne(buffer,0);
            buffer = buffer.slice(nextPos);
        }catch(errr){
            socket.write("-ERR parsing error\r\n");
            buffer = "";
        }
    })

    socket.on("close",()=>{
        console.log("Client Disconnected")
    })

    socket.on("error",(err)=>{
        console.log("socket error", err.message)
    })
})