import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 });

// store all connected clients
const clients = new Set();
export function startWsServer() {
  wss.on("connection", (ws) => {
    console.log("New client connected");
    clients.add(ws);

    // when a message comes from ANY client
    ws.on("message", (msg) => {
      const message = msg.toString();
      console.log("Received:", message);

      // broadcast to everyone
      for (const client of clients) {
        // @ts-ignore
        if (client.readyState === 1) {
          // @ts-ignore
          client.send(message);
        }
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("Client disconnected");
    });
  });
}

console.log("Chat server running on ws://localhost:3000");
