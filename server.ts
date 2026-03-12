import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocket, closeSocket } from "./lib/socket-server";
import { prisma } from "./lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
let server: ReturnType<typeof createServer> | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("[Server] Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 15_000);
  forceExitTimer.unref();

  try {
    await closeSocket();
  } catch (err) {
    console.error("[Server] Socket shutdown error:", err);
  }

  try {
    await new Promise<void>((resolve) => {
      if (!server) {
        resolve();
        return;
      }

      server.close((err?: Error) => {
        if (err) {
          console.error("[Server] HTTP close error:", err);
        }
        resolve();
      });
    });
  } catch (err) {
    console.error("[Server] HTTP shutdown error:", err);
  }

  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("[Server] Prisma disconnect error:", err);
  }

  clearTimeout(forceExitTimer);
  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

app.prepare().then(() => {
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize Socket.io with the HTTP server
  initializeSocket(server);
  console.log("[Socket.io] Server initialized");

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`[Server] Ready on http://${hostname}:${port}`);
  });
});
