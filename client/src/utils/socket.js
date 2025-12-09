import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    console.log("[Socket] Initializing socket connection to:", socketUrl);
    
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    });

    socket.on("connect", () => {
      console.log("[Socket] ✅ Connected with ID:", socket.id);
      console.log("[Socket] Transport:", socket.io.engine.transport.name);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] ❌ Disconnected. Reason:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] ⚠️ Connection error:", error.message);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("[Socket] 🔄 Reconnected after", attemptNumber, "attempts");
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinAdminRoom = () => {
  const sock = getSocket();
  console.log("[Socket] Emitting join-admin-room event with socket ID:", sock.id);
  sock.emit("join-admin-room");
  console.log("[Socket] ✅ Join request sent to admin-room");
};

export const leaveAdminRoom = () => {
  const sock = getSocket();
  if (sock) {
    sock.emit("leave-admin-room");
    console.log("Left admin room");
  }
};

