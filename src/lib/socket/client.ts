import { io, type Socket } from 'socket.io-client';
import { env } from '@/lib/env';

let socket: Socket | null = null;

export function getSocketClient(sessionToken?: string) {
  if (!socket) {
    socket = io(env.socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: sessionToken
        ? {
            sessionToken,
          }
        : undefined,
    });
  }

  if (sessionToken) {
    socket.auth = {
      sessionToken,
    };
  }

  return socket;
}
