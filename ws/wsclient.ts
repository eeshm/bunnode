import WebSocket from "ws";
import readline from "readline"


// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ws =  new WebSocket("ws://localhost:3000")

ws.on("open", () => {
  console.log("Connected to WebSocket server");

  rl.on("line", (input) => {
    ws.send(input);
  });
});


ws.on("message", (data) => {
  console.log("Server:", data.toString());
});


ws.on("close", () => {
  console.log("Disconnected");
  process.exit(0);
})

ws.on("error", (err) => {
  console.error("WebSocket error:", err.message);
});