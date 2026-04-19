import http from "node:http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initializeSocketServer } from "./sockets/index.js";

let server;
let isShuttingDown = false;

async function startServer() {
  await connectDatabase();

  server = http.createServer(app);
  initializeSocketServer(server);

  server.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        environment: env.nodeEnv
      },
      "HTTP server started"
    );
  });
}

async function shutdown(signal, error) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (error) {
    logger.error({ err: error, signal }, "Server shutting down because of fatal error");
  } else {
    logger.warn({ signal }, "Server shutting down");
  }

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((closeError) => {
          if (closeError) {
            reject(closeError);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectDatabase();
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    logger.fatal({ err: shutdownError }, "Graceful shutdown failed");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("unhandledRejection", (error) => {
  shutdown("unhandledRejection", error);
});

process.on("uncaughtException", (error) => {
  shutdown("uncaughtException", error);
});

startServer().catch((error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
