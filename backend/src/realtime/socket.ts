import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { verifyToken } from '../lib/auth.js';
import { query } from '../db/pool.js';
import { setIo, orderRoom } from './hub.js';
import { config } from '../config.js';
import type { AuthUser } from '../types/models.js';

// Augment Socket so `socket.user` is typed throughout this module.
declare module 'socket.io' {
  interface Socket {
    user?: AuthUser;
  }
}

export function attachSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
  });
  setIo(io);

  // JWT handshake auth
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = verifyToken(token);
      socket.user = { id: Number(payload.sub), name: payload.name, role: payload.role };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  // Per-socket simple token bucket so an attacker can't emit 10k events/sec.
  const buckets = new WeakMap<Socket, { tokens: number; refilledAt: number }>();
  const SOCKET_EVENT_LIMIT = 60; // events per 10s
  const SOCKET_WINDOW_MS = 10_000;
  function allowSocketEvent(socket: Socket): boolean {
    const now = Date.now();
    const bucket = buckets.get(socket) || { tokens: SOCKET_EVENT_LIMIT, refilledAt: now };
    if (now - bucket.refilledAt > SOCKET_WINDOW_MS) {
      bucket.tokens = SOCKET_EVENT_LIMIT;
      bucket.refilledAt = now;
    }
    if (bucket.tokens <= 0) { buckets.set(socket, bucket); return false; }
    bucket.tokens--;
    buckets.set(socket, bucket);
    return true;
  }

  io.on('connection', (socket: Socket) => {
    // Join an order's private chat room, only if the user is a party to it.
    socket.on('order:join', async (orderId: number | string) => {
      if (!allowSocketEvent(socket)) return;
      const id = Number(orderId);
      if (!Number.isFinite(id) || id <= 0) { socket.emit('error', { message: 'Invalid order id' }); return; }
      const { rows } = await query<{ client_id: number; freelancer_id: number }>(
        'SELECT client_id, freelancer_id FROM orders WHERE id = $1', [id]
      );
      const o = rows[0];
      if (!o || !socket.user || (o.client_id !== socket.user.id && o.freelancer_id !== socket.user.id)) {
        socket.emit('error', { message: 'Cannot join this order room' });
        return;
      }
      socket.join(orderRoom(id));
      socket.emit('order:joined', { orderId: id });
    });

    socket.on('order:leave', (orderId: number | string) => {
      if (!allowSocketEvent(socket)) return;
      socket.leave(orderRoom(orderId));
    });

    // Typing indicator relay
    socket.on('typing', ({ orderId }: { orderId: number | string }) => {
      if (!allowSocketEvent(socket)) return;
      socket.to(orderRoom(orderId)).emit('typing', { orderId, user: socket.user?.name });
    });
  });

  return io;
}
