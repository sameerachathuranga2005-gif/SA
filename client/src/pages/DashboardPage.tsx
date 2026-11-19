import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { socketService } from '../services/socket';
import { AppShell } from '../components/layout/AppShell';

export const DashboardPage: React.FC = () => {
  const {
    token,
    fetchCurrentUser,
    fetchFriends,
    fetchFriendRequests,
    updateUserOnlineStatus,
  } = useAuthStore();

  const { showToast } = useAppStore();

  useEffect(() => {
    if (!token) return;

    // Connect socket if not already connected
    const socket = socketService.connect(token);

    // Initial data fetch
    fetchCurrentUser();
    fetchFriends();
    fetchFriendRequests();

    // Socket Event: user-online
    const handleOnline = (data: { userId: string; isOnline: boolean }) => {
      updateUserOnlineStatus(data.userId, true);
    };

    // Socket Event: user-offline
    const handleOffline = (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
      updateUserOnlineStatus(data.userId, false, data.lastSeen);
    };

    // Socket Event: friend-request-received
    const handleFriendRequest = (data: { from: any; createdAt: string }) => {
      showToast(`New friend request from ${data.from?.name || 'someone'}!`, 'info');
      fetchFriendRequests();
    };

    // Socket Event: friend-request-accepted
    const handleFriendAccepted = (data: { by: any }) => {
      showToast(`${data.by?.name || 'Someone'} accepted your friend request!`, 'success');
      fetchFriends();
      fetchFriendRequests();
    };

    socket.on('user-online', handleOnline);
    socket.on('user-offline', handleOffline);
    socket.on('friend-request-received', handleFriendRequest);
    socket.on('friend-request-accepted', handleFriendAccepted);

    return () => {
      socket.off('user-online', handleOnline);
      socket.off('user-offline', handleOffline);
      socket.off('friend-request-received', handleFriendRequest);
      socket.off('friend-request-accepted', handleFriendAccepted);
    };
  }, [token]);

  return <AppShell />;
};

