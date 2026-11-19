import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMeetingStore } from '../store/meetingStore';
import { MeetingLobby } from '../components/meetings/MeetingLobby';
import { MeetingRoom } from '../components/meetings/MeetingRoom';

export const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const { isInLobby, isJoined, initLobby } = useMeetingStore();

  useEffect(() => {
    if (meetingId && user) {
      initLobby(meetingId, user);
    }
  }, [meetingId, user]);

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

