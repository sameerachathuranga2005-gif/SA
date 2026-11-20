import React, { useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMeetingStore } from '../store/meetingStore';
import { MeetingLobby } from '../components/meetings/MeetingLobby';
import { MeetingRoom } from '../components/meetings/MeetingRoom';

export const MeetingPage: React.FC = () => {
  const params = useParams<{ meetingId?: string; roomId?: string }>();
  const [searchParams] = useSearchParams();
  const queryRoom = searchParams.get('room');
  const pwd = searchParams.get('pwd') || undefined;
  const id = params.roomId || params.meetingId || queryRoom;

  const { user, isAuthenticated } = useAuthStore();
  const { isInLobby, isInWaitingRoom, isJoined, initLobby } = useMeetingStore();

  useEffect(() => {
    if (id && user) {
      initLobby(id, user, pwd);
    }
  }, [id, user, pwd]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isJoined) {
    return <MeetingRoom />;
  }

  if (isInLobby || isInWaitingRoom) {
    return <MeetingLobby />;
  }

  return null;
};

