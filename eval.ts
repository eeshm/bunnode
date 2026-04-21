type Cmd = {
    cmd: string;
    args: string[];
};

function encode(value:any,simple:boolean = true){
    if(typeof value == "string"){
        return simple
         ? `+$${value}\r\n` 
         : `+$${value.length}\r\n${value}\r\n`

    }

    if (value === null) return "$-1\r\n";

    return `:${value}\r\n`;
}



function evalPing(cmd : Cmd){
    if(cmd.args.length ==0){
        return encode("PONG",true);
    }
    if(cmd.args.length ==1){
        return encode(cmd.args[0],false)
    }
    return "-ERR wrong number of arguments for 'PING'\r\n";

}


export function evalAndRespone(cmd:Cmd) :string{
    switch(cmd.cmd){
        case "PING":
            return evalPing(cmd);
        default:
            return "-ERr unkown command\r\n";
    }
}