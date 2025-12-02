"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Socket type definition
type Socket = any;

let globalSocket: Socket | null = null;
let socketIOClient: any = null;

// Try to load socket.io-client if available
try {
  socketIOClient = require("socket.io-client");
} catch {
  // socket.io-client not available - will be handled in the hook
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // If socket.io-client isn't available, just mark as not loading
    if (!socketIOClient) {
      setIsLoading(false);
      return;
    }

    // Reuse existing connection if available
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    // Create new connection
    const socket = socketIOClient.io(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        path: "/api/socket.io",
      }
    );

    socketRef.current = socket;
    globalSocket = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      setIsConnected(true);
      setIsLoading(false);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[Socket] Connection error:", error);
      setIsLoading(false);
    });

    return () => {
      // Don't disconnect on unmount - keep the connection alive
      // socket?.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
    return () => {};
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isLoading,
    emit,
    on,
  };
}
