import { io, Socket } from 'socket.io-client';

// Get base server URL for WebSockets (prefers VITE_API_URL or VITE_SOCKET_URL, falls back to cloud backend)
const rawUrl =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_SOCKET_URL as string) ||
  'https://sameeraas.alwaysdata.net';
// Strip trailing /api and trailing slashes so Socket.io connects to root domain
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export interface SocketUserPayload {
  uid?: string;
  _id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(token?: string | null, userInfo?: SocketUserPayload | null): Socket {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const activeToken = token || localStorage.getItem('omnisync_token') || '';
    let user = userInfo;
    if (!user) {
      try {
        const stored = localStorage.getItem('omnisync_user');
        if (stored) user = JSON.parse(stored);
      } catch (e) {
        user = null;
      }
    }

    const uid = user?.uid || user?._id || '';
    const name = user?.name || user?.displayName || 'User';
    const email = user?.email || '';

    this.socket = io(SOCKET_URL, {
      auth: {
        token: activeToken,
        uid,
        name,
        displayName: name,
        email,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[Socket] Connected to real-time server with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[Socket] Disconnected from server. Reason:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
