// Thin indirection so route handlers can emit Socket.io events without a circular import.
import type { Server } from 'socket.io';

let io: Server | null = null;
export const setIo = (instance: Server): void => { io = instance; };
export const orderRoom = (orderId: number | string): string => `order:${orderId}`;

export function emitToOrder(orderId: number | string, event: string, payload: unknown): void {
  if (io) io.to(orderRoom(orderId)).emit(event, payload);
}
