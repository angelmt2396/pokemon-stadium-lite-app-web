export type SocketAck<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

