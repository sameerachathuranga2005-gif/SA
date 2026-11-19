import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMeetingStore } from '../store/meetingStore';
import { MeetingLobby } from '../components/meetings/MeetingLobby';
import { MeetingRoom } from '../components/meetings/MeetingRoom';

export const MeetingPage: React.FC = () => {
  const params = useParams<{ meetingId?: string; roomId?: string }>();
  const id = params.roomId || params.meetingId;
  const { user, isAuthenticated } = useAuthStore();
  const { isInLobby, isJoined, initLobby } = useMeetingStore();

  useEffect(() => {
    if (id && user) {
      initLobby(id, user);
    }
  }, [id, user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isJoined) {
    return <MeetingRoom />;
  }

  if (isInLobby) {
    return <MeetingLobby />;
  }

  return null;
};

