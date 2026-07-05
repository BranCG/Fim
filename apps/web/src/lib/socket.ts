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
    
    const logEvent = (eventName: string, details?: any) => {
      console.log(`[Socket Debug] ${eventName}`, details);
      try {
        const logs = JSON.parse(localStorage.getItem('socket_logs') || '[]');
        const time = new Date().toLocaleTimeString('es-CL');
        const detailStr = details ? ` (${details})` : '';
        logs.unshift(`${time} - ${eventName}${detailStr}`);
        localStorage.setItem('socket_logs', JSON.stringify(logs.slice(0, 8)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('socket_logs_updated'));
        }
      } catch (e) {}
    };

    socket.on('connect', () => logEvent('connect', socket?.id));
    socket.on('disconnect', (reason) => logEvent('disconnect', reason));
    socket.on('connect_error', (err) => logEvent('connect_error', err.message));

    // Log all incoming custom events for debugging on mobile devices
    socket.onAny((eventName, ...args) => {
      logEvent(`onAny: ${eventName}`);
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
