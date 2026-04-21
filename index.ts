import "dotenv/config";
import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import { createClient } from "redis";
import { testing } from "./src/db/schema";
import { server } from "./sync_tcp";

import { startWsServer } from "./ws/wsserver";



const port = Number(process.env.PORT ?? 3000);

const app = express();

app.get("/", (_req, res) => {
	res.send("Hello World");
});

app.get("/health", async (_req, res) => {
	return res.json({ status: "ok" });

});

async function startServer() {
	server.listen(port, () => {
		console.log(`Redis clone is running on port ${port}`);
	});
	// app.listen(port, () => {
	// 	console.log(`Server running at http://localhost:${port}`);
	// });
	// startWsServer();
}

startServer().catch(async (error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});






