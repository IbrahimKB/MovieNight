import { Server as HTTPServer } from "http";

let io: any = null; // SocketIOServer type is only needed at runtime, not in dev

try {
  const SocketIO = require("socket.io");
  // Socket.io will be imported only when custom server runs (production)
} catch (e) {
  // Socket.io not available (development with next dev)
}

const userSockets = new Map<string, string>(); // userId -> socketId

export function initializeSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: "/api/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // User joins their personal room for notifications
    socket.on("user:join", (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} joined their room`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Find and remove user from map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`[Socket] User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

export function getSocket() {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function getUserSocket(userId: string) {
  return userSockets.get(userId);
}
