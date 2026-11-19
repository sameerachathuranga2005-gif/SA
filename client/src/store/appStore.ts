import { create } from 'zustand';
import { ActiveModule } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface AppState {
  activeModule: ActiveModule;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  isProfileOpen: boolean;
  activeChatFriendId: string | null;
  isJoinMeetingModalOpen: boolean;
  toasts: Toast[];

  setActiveModule: (module: ActiveModule) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setActiveChatFriendId: (friendId: string | null) => void;
  setJoinMeetingModalOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'feed',
  isSearchOpen: false,
  isNotificationsOpen: false,
  isProfileOpen: false,
  activeChatFriendId: null,
  isJoinMeetingModalOpen: false,
  toasts: [],

  setActiveModule: (module) => set({ activeModule: module }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setActiveChatFriendId: (friendId) => set({ activeChatFriendId: friendId }),
  setJoinMeetingModalOpen: (open) => set({ isJoinMeetingModalOpen: open }),

  showToast: (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3500);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

