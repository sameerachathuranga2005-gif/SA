export interface IUserSummary {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  personalMeetingId: string;
  isOnline: boolean;
  lastSeen: string | Date;
  friendsCount?: number;
  pendingRequestsCount?: number;
}

export type FriendStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received';

export interface ISearchUserResult extends IUserSummary {
  friendStatus: FriendStatus;
}

export interface IFriendRequestItem {
  requestId: string;
  user: IUserSummary;
  createdAt: string;
}

export interface IFriendRequestsData {
  incoming: IFriendRequestItem[];
  outgoing: IFriendRequestItem[];
}

export type ActiveModule = 'feed' | 'chats' | 'meetings';

export interface ISocialPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    online: boolean;
  };
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  commentsCount: number;
  comments: {
    id: string;
    author: string;
    avatar: string;
    content: string;
    createdAt: string;
  }[];
}

export interface IChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface IConversation {
  id: string;
  participant: IUserSummary;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: IChatMessage[];
}

export interface IScheduledMeeting {
  id: string;
  title: string;
  meetingId: string;
  hostName: string;
  time: string;
  duration: string;
  participantsCount: number;
}

// ==========================================
// ZOOM MEETING TYPES
// ==========================================

export interface IWaitingUser {
  socketId: string;
  userId: string;
  userName: string;
  avatar?: string;
  joinedAt?: Date | string;
}

export interface IParticipant {
  id: string;
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  stream?: MediaStream | null;
  isSpeaking?: boolean;
  isSimulated?: boolean;
}

export interface IMeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
  to?: string; // 'everyone' or specific user name
  recipientSocketId?: string;
  isDirect?: boolean;
}

export interface IFloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  xPos: number; // percentage across screen
}

export interface ISecuritySettings {
  lockMeeting: boolean;
  waitingRoom: boolean;
  allowShareScreen: boolean;
  allowChat: boolean;
  allowRename: boolean;
  allowUnmute: boolean;
}
