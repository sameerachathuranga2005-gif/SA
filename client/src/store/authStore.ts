import { create } from 'zustand';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { IUserSummary, IFriendRequestsData } from '../types';

interface AuthState {
  user: IUserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  friends: IUserSummary[];
  friendRequests: IFriendRequestsData;
  isFriendsLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (senderUserId: string) => Promise<void>;
  rejectFriendRequest: (senderUserId: string) => Promise<void>;
  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string | Date) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initial state from localStorage if available
  const savedToken = localStorage.getItem('omnisync_token');
  const savedUser = localStorage.getItem('omnisync_user');
  let parsedUser: IUserSummary | null = null;
  try {
    if (savedUser) parsedUser = JSON.parse(savedUser);
  } catch (e) {
    parsedUser = null;
  }

  return {
    user: parsedUser,
    token: savedToken,
    isAuthenticated: !!savedToken,
    isLoading: false,
    error: null,
    friends: [],
    friendRequests: { incoming: [], outgoing: [] },
    isFriendsLoading: false,

    clearError: () => set({ error: null }),

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data.data;

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Initialize socket connection
        socketService.connect(token);
        get().fetchFriends();
        get().fetchFriendRequests();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Login failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    register: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/register', { name, email, password });
        const { token, user } = response.data.data;

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        socketService.connect(token);
        get().fetchFriends();
        get().fetchFriendRequests();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Registration failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    demoLogin: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/demo-login');
        const { token, user } = response.data.data;

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        socketService.connect(token);
        await get().fetchFriends();
        await get().fetchFriendRequests();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Demo login failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    logout: () => {
      localStorage.removeItem('omnisync_token');
      localStorage.removeItem('omnisync_user');
      socketService.disconnect();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        friends: [],
        friendRequests: { incoming: [], outgoing: [] },
      });
    },

    fetchCurrentUser: async () => {
      const token = get().token;
      if (!token) return;

      try {
        const response = await api.get('/auth/me');
        const user = response.data.data;
        localStorage.setItem('omnisync_user', JSON.stringify(user));
        set({ user });
      } catch (err) {
        console.error('Failed to fetch current user profile:', err);
      }
    },

    fetchFriends: async () => {
      set({ isFriendsLoading: true });
      try {
        const response = await api.get('/users/friends');
        set({ friends: response.data.data || [], isFriendsLoading: false });
      } catch (err) {
        console.error('Failed to fetch friends:', err);
        set({ isFriendsLoading: false });
      }
    },

    fetchFriendRequests: async () => {
      try {
        const response = await api.get('/users/friend-requests');
        set({ friendRequests: response.data.data || { incoming: [], outgoing: [] } });
      } catch (err) {
        console.error('Failed to fetch friend requests:', err);
      }
    },

    sendFriendRequest: async (targetUserId: string) => {
      try {
        await api.post('/users/friend-request', { targetUserId });
        await get().fetchFriendRequests();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to send friend request';
        throw new Error(msg);
      }
    },

    acceptFriendRequest: async (senderUserId: string) => {
      try {
        await api.post('/users/accept-friend', { senderUserId });
        await Promise.all([get().fetchFriends(), get().fetchFriendRequests(), get().fetchCurrentUser()]);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to accept friend request';
        throw new Error(msg);
      }
    },

    rejectFriendRequest: async (senderUserId: string) => {
      try {
        await api.post('/users/reject-friend', { senderUserId });
        await get().fetchFriendRequests();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to decline friend request';
        throw new Error(msg);
      }
    },

    updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string | Date) => {
      set((state) => ({
        friends: state.friends.map((friend) =>
          friend._id === userId
            ? { ...friend, isOnline, lastSeen: lastSeen || new Date() }
            : friend
        ),
      }));
    },
  };
});

