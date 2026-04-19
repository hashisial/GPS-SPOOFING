import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { env } from "../config/env.js";
import { useAuth } from "./useAuth.js";
import { isDemoAccessToken } from "../services/api/demo-api.js";

let socketInstance = null;

function getSocketInstance(token) {
  if (!socketInstance) {
    socketInstance = io(env.socketUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"]
    });
  }

  socketInstance.auth = {
    token
  };

  return socketInstance;
}

export function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(Boolean(socketInstance?.connected));

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketInstance?.connected) {
        socketInstance.disconnect();
      }

      setIsConnected(false);
      return undefined;
    }

    if (isDemoAccessToken(token)) {
      if (socketInstance?.connected) {
        socketInstance.disconnect();
      }

      setIsConnected(true);
      return undefined;
    }

    const socket = getSocketInstance(token);

    function handleConnect() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [isAuthenticated, token]);

  return {
    socket: socketInstance,
    isConnected
  };
}
