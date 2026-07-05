import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

const SOCKET_URL = API_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    
    // Log all incoming events for debugging on mobile devices
    socket.onAny((eventName, ...args) => {
      console.log(`[Socket Debug] Event: ${eventName}`);
      try {
        const logs = JSON.parse(localStorage.getItem('socket_logs') || '[]');
        logs.unshift(`${new Date().toLocaleTimeString('es-CL')} - ${eventName}`);
        localStorage.setItem('socket_logs', JSON.stringify(logs.slice(0, 5)));
        // Dispatch custom event to update UI immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('socket_logs_updated'));
        }
      } catch (e) {}
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function forceReconnectSocket(): Socket {
  const s = getSocket();
  s.disconnect();
  s.connect();
  return s;
}
