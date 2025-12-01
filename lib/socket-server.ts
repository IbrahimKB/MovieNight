import { Server as HTTPServer } from "http";
import { Socket } from "socket.io";

interface SocketWithUser extends Socket {
  userId?: string;
}

let io: any = null;
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId (for O(1) lookup on disconnect)

export function initializeSocket(server: HTTPServer) {
  if (io) return io;

  try {
    const { Server: SocketIOServer } = require("socket.io");

    io = new SocketIOServer(server, {
      path: "/api/socket.io",
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket: SocketWithUser) => {
      console.log(`[Socket] User connected: ${socket.id}`);

      // User joins their personal room for notifications
      socket.on("user:join", (userId: string) => {
        if (!userId) {
          console.error("[Socket] user:join called without userId");
          return;
        }

        // Store mapping bidirectionally for efficient cleanup
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(`[Socket] User ${userId} joined their room`);
      });

      // Handle disconnection with O(1) lookup
      socket.on("disconnect", () => {
        try {
          // Use reverse map for efficient lookup
          const userId = socketUsers.get(socket.id) || socket.userId;
          if (userId) {
            userSockets.delete(userId);
            socketUsers.delete(socket.id);
            console.log(`[Socket] User ${userId} disconnected`);
          } else {
            // Socket never joined (only registered connection)
            socketUsers.delete(socket.id);
          }
        } catch (error) {
          console.error("[Socket] Error during disconnect cleanup:", error);
        }
      });
    });

    console.log("[Socket.io] Server initialized successfully");
  } catch (error) {
    console.warn("[Socket.io] Not available (running with next dev)");
    // Socket.io not available in development with next dev
  }

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
