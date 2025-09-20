import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function initSocket() {
  const token = getAuthToken();
  socket = io("/", {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    forceNew: true,
    autoConnect: false,
    auth: token ? { token } : undefined,
    withCredentials: true,
  });
  return socket;
}

export function getSocket(): Socket {
  if (!socket) return initSocket();
  return socket!;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data?.token as string | undefined;
    if (token) {
      localStorage.setItem('auth_token', token);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function connectSocket() {
  const s = getSocket();
  if (s.connected) return s;
  let token = getAuthToken();
  s.auth = token ? { token } : undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      s.once('connect', () => resolve());
      s.once('connect_error', (e) => reject(e));
      s.connect();
    });
  } catch (e) {
    token = await refreshAccessToken();
    if (!token) throw e;
    s.auth = { token };
    await new Promise<void>((resolve, reject) => {
      s.once('connect', () => resolve());
      s.once('connect_error', (err) => reject(err));
      s.connect();
    });
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
