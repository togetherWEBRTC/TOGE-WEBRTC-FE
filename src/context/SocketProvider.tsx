// SocketContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Context 생성
const SocketContext = createContext<Socket | null>(null);

// Provider 컴포넌트
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket] = useState(
    io(import.meta.env.VITE_BASE_SOCKET_URL, {
      autoConnect: false,
    })
  );

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
