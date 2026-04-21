import net from "net";

let concurrentUsers = 0;

const server = net.createServer((socket) => {
    const clientIp = socket.remoteAddress;
    const clientPort = socket.remotePort;

    concurrentUsers += 1;
    console.log("connected client ip", clientIp, "port", clientPort);

    socket.on("data", (data) => {
        socket.write(data);
        console.log(data.toString())
    });

    socket.on("close", () => {
        concurrentUsers = Math.max(0, concurrentUsers - 1);
    });

    socket.on("error", (error) => {
        console.error("socket error:", error.message);
    });

});

export default server;