import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocket } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
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
  const io = initializeSocket(server);
  console.log("[Socket.io] Server initialized");

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`[Server] Ready on http://${hostname}:${port}`);
  });
});
