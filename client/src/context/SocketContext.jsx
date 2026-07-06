import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    setSocket(nextSocket);
    return () => nextSocket.disconnect();
  }, [user]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
