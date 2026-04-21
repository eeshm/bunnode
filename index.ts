import "dotenv/config";
import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import { createClient } from "redis";
import { testing } from "./src/db/schema";
import server from "./server";

import { startWsServer } from "./ws/wsserver";



const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;

if (!databaseUrl) {
	throw new Error("Missing DATABASE_URL in environment variables.");
}

if (!redisUrl) {
	throw new Error("Missing REDIS_URL in environment variables.");
}

const app = express();

app.get("/", (_req, res) => {
	res.send("Hello World");
});

app.get("/health", async (_req, res) => {
	return res.json({ status: "ok" });

});

async function startServer() {
	server.listen(port, () => {
		console.log(`Server running at http://localhost:${port}`);
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






