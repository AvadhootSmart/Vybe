import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://.168.13.90:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Client connected to the websocket server", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log(newSocket.id, " disconnected");
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
