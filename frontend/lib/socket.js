import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: {
      token
    },
    autoConnect: true,
    transports: ["websocket"]
  });
}
