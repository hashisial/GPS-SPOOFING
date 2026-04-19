import http from "node:http";
import app from "./app.js";
import prisma from "./config/db.js";
import env from "./config/env.js";
import { initializeSocketServer } from "./sockets/index.js";

const server = http.createServer(app);
const io = initializeSocketServer(server);

app.set("io", io);

server.listen(env.port, () => {
  console.log(`Backend server listening on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
