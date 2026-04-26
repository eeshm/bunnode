import net from "net";

for (let i = 0; i < 4; i++) {
  const client = net.createConnection({ port: 3000 }, () => {
    console.log(`client ${i + 1} connected`);
    client.write(`client ${i + 1} says hi`);
  });


  client.on("data", (data) => {
    console.log(data.toString());

    setTimeout(() => {
      client.end();
    }, i * 1000);
  });


  client.on("error", (error) => {
    console.error(`client ${i + 1} error:`, error.message);
  });


  client.on("end", () => {
    console.log(`client ${i + 1} disconnected`);
  });
}
