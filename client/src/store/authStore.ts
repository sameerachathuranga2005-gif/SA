import { create } from 'zustand';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { IUserSummary, IFriendRequestsData } from '../types';

function generatePmiFromUid(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 900000000) + 100000000;
  return num.toString();
}

const mockDemoFriends: IUserSummary[] = [
  {
    _id: 'sample_friend_1',
    name: 'Sarah Connor',
    email: 'sarah.c@sky.net',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    bio: 'AI Safety & Resilience Advocate',
    personalMeetingId: '312654987',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    _id: 'sample_friend_2',
    name: 'David Kim',
    email: 'david.k@matrix.org',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    bio: 'Distributed Systems Architect',
    personalMeetingId: '542198734',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    _id: 'sample_friend_3',
    name: 'Elena Rostova',
    email: 'elena.r@quantum.io',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
    bio: 'Full-Stack & WebRTC Engineer',
    personalMeetingId: '768234195',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
];

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
  loginWithGoogle: () => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  syncFirebaseUser: (firebaseUser: FirebaseUser) => Promise<void>;
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

  // Auto connect socket if already logged in
  if (savedToken && parsedUser) {
    socketService.connect(savedToken, parsedUser);
  }

  return {
    user: parsedUser,
    token: savedToken,
    isAuthenticated: !!savedToken,
    isLoading: false,
    error: null,
    friends: parsedUser?._id?.startsWith('demo_') ? mockDemoFriends : [],
    friendRequests: { incoming: [], outgoing: [] },
    isFriendsLoading: false,

    clearError: () => set({ error: null }),

    loginWithGoogle: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const token = await fbUser.getIdToken();

        const userSummary: IUserSummary = {
          _id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || '',
          avatar:
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.displayName || 'Google')}`,
          bio: 'Verified Google Account',
          personalMeetingId: generatePmiFromUid(fbUser.uid),
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: 0,
          pendingRequestsCount: 0,
        };

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(userSummary));

        set({
          token,
          user: userSummary,
          isAuthenticated: true,
          isLoading: false,
        });

        socketService.connect(token, userSummary);
        get().fetchFriends().catch(() => {});
        get().fetchFriendRequests().catch(() => {});
      } catch (err: any) {
        console.error('Google Sign-In error:', err);
        const msg = err.message || 'Google sign-in failed. Please try again.';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;
        const token = await fbUser.getIdToken();

        const userSummary: IUserSummary = {
          _id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'OmniSync User',
          email: fbUser.email || email,
          avatar:
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.email || 'User')}`,
          bio: 'OmniSync Member',
          personalMeetingId: generatePmiFromUid(fbUser.uid),
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: 0,
          pendingRequestsCount: 0,
        };

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(userSummary));

        set({
          token,
          user: userSummary,
          isAuthenticated: true,
          isLoading: false,
        });

        socketService.connect(token, userSummary);
        get().fetchFriends().catch(() => {});
        get().fetchFriendRequests().catch(() => {});
      } catch (err: any) {
        let msg = err.message || 'Login failed';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password'
        ) {
          msg = 'Invalid email or password.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please try again later.';
        }
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    register: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;
        if (name.trim()) {
          try {
            await updateProfile(fbUser, { displayName: name.trim() });
          } catch (_e) {
            // Profile update non-fatal
          }
        }
        const token = await fbUser.getIdToken();

        const userSummary: IUserSummary = {
          _id: fbUser.uid,
          name: name.trim() || fbUser.email?.split('@')[0] || 'OmniSync User',
          email: fbUser.email || email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
          bio: 'New OmniSync Member',
          personalMeetingId: generatePmiFromUid(fbUser.uid),
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: 0,
          pendingRequestsCount: 0,
        };

        localStorage.setItem('omnisync_token', token);
        localStorage.setItem('omnisync_user', JSON.stringify(userSummary));

        set({
          token,
          user: userSummary,
          isAuthenticated: true,
          isLoading: false,
        });

        socketService.connect(token, userSummary);
        get().fetchFriends().catch(() => {});
        get().fetchFriendRequests().catch(() => {});
      } catch (err: any) {
        let msg = err.message || 'Registration failed';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email is already registered. Please log in instead.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        }
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    demoLogin: async () => {
      set({ isLoading: true, error: null });
      try {
        // Create local demo user completely in the browser with random UID
        const randomId = Math.random().toString(36).substring(2, 9);
        const pmi = Math.floor(100000000 + Math.random() * 900000000).toString();
        const demoToken = `demo_token_${randomId}_${Date.now()}`;

        const demoUser: IUserSummary = {
          _id: `demo_${randomId}`,
          name: 'Alex Johnson (Demo)',
          email: `demo.${randomId}@superapp.dev`,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
          bio: 'Recruiter Demo Account (Offline Ready)',
          personalMeetingId: pmi,
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: 3,
          pendingRequestsCount: 1,
        };

        localStorage.setItem('omnisync_token', demoToken);
        localStorage.setItem('omnisync_user', JSON.stringify(demoUser));

        set({
          token: demoToken,
          user: demoUser,
          isAuthenticated: true,
          friends: mockDemoFriends,
          isLoading: false,
        });

        socketService.connect(demoToken, demoUser);

        // Optional non-blocking sync with backend if available
        api.post('/auth/demo-login').catch(() => {});
      } catch (err: any) {
        const msg = err.message || 'Demo login failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    syncFirebaseUser: async (fbUser: FirebaseUser) => {
      try {
        const token = await fbUser.getIdToken();
        const currentUser = get().user;

        // Only sync if user changed or was not set
        if (!currentUser || currentUser._id !== fbUser.uid) {
          const userSummary: IUserSummary = {
            _id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'OmniSync User',
            email: fbUser.email || '',
            avatar:
              fbUser.photoURL ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.displayName || 'User')}`,
            bio: 'OmniSync Member',
            personalMeetingId: generatePmiFromUid(fbUser.uid),
            isOnline: true,
            lastSeen: new Date(),
            friendsCount: currentUser?.friendsCount || 0,
            pendingRequestsCount: currentUser?.pendingRequestsCount || 0,
          };

          localStorage.setItem('omnisync_token', token);
          localStorage.setItem('omnisync_user', JSON.stringify(userSummary));

          set({
            token,
            user: userSummary,
            isAuthenticated: true,
          });

          socketService.connect(token, userSummary);
        }
      } catch (err) {
        console.warn('Error syncing Firebase auth state:', err);
      }
    },

    logout: async () => {
      try {
        await signOut(auth);
      } catch (_e) {
        // Ignore signout error
      }
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
        // Backend optional
      }
    },

    fetchFriends: async () => {
      set({ isFriendsLoading: true });
      try {
        const response = await api.get('/users/friends');
        set({ friends: response.data.data || [], isFriendsLoading: false });
      } catch (err) {
        // Keep existing friends or demo friends
        set({ isFriendsLoading: false });
      }
    },

    fetchFriendRequests: async () => {
      try {
        const response = await api.get('/users/friend-requests');
        set({ friendRequests: response.data.data || { incoming: [], outgoing: [] } });
      } catch (err) {
        // Backend optional
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
