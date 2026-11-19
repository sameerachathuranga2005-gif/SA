import { Types } from 'mongoose';

export interface IFriendRequest {
  _id?: Types.ObjectId | string;
  user: Types.ObjectId | string | IUserSummary;
  direction: 'sent' | 'received';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  friends: (Types.ObjectId | string | IUserSummary)[];
  friendRequests: IFriendRequest[];
  personalMeetingId: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserSummary {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  personalMeetingId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface IAuthResponse {
  token: string;
  user: IUserSummary & {
    friendsCount: number;
    pendingRequestsCount: number;
  };
}

export type FriendStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received';

export interface ISearchUserResult extends IUserSummary {
  friendStatus: FriendStatus;
}

// Meeting Types
export interface IMeetingParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
}

export interface IMeetingRoom {
  meetingId: string;
  title: string;
  hostId: string;
  hostName: string;
  passcode: string;
  createdAt: Date;
  isLocked: boolean;
  participants: Map<string, IMeetingParticipant>; // socketId -> participant
}

export interface IMeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}
