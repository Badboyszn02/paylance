import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('paylance_token') : null;
  socket = io(url, { auth: { token }, autoConnect: true, transports: ['websocket', 'polling'] });
  return socket;
}

export function resetSocket(): void {
  if (socket) { socket.disconnect(); socket = null; }
}
