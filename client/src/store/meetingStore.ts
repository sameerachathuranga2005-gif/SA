import { create } from 'zustand';
import { socketService } from '../services/socket';
import { MediaService, MeetingRecorder } from '../services/webrtc';
import { soundEffects } from '../services/soundEffects';
import { VirtualBackgroundType } from '../services/videoFilters';
import {
  IParticipant,
  IMeetingChatMessage,
  IFloatingReaction,
  ISecuritySettings,
  IUserSummary,
} from '../types';

interface MeetingState {
  // Room Info
  meetingId: string;
  title: string;
  hostId: string;
  hostName: string;
  passcode: string;
  isHost: boolean;
  isInLobby: boolean;
  isJoined: boolean;

  // Media
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  virtualBg: VirtualBackgroundType;

  // Recording
  isRecording: boolean;
  recordingDuration: number;
  recorder: MeetingRecorder;
  recordingInterval: any;

  // Participants & Speaking
  participants: IParticipant[];
  activeSpeakerId: string | null;
  pinnedParticipantId: string | null;
  isHandRaised: boolean;

  // UI & Drawers
  viewMode: 'gallery' | 'speaker';
  activeDrawer: 'chat' | 'participants' | 'security' | null;
  isLeaveModalOpen: boolean;
  isWhiteboardOpen: boolean;
  isVirtualBgModalOpen: boolean;
  isInfoModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  unreadChatCount: number;

  // Messages & Reactions
  chatMessages: IMeetingChatMessage[];
  floatingReactions: IFloatingReaction[];
  securitySettings: ISecuritySettings;

  // Actions
  initLobby: (meetingId: string, currentUser: IUserSummary) => Promise<void>;
  joinMeeting: (currentUser: IUserSummary) => Promise<void>;
  leaveMeeting: (endForAll?: boolean) => void;
  toggleAudio: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleWhiteboard: () => void;
  toggleRecord: () => void;
  toggleHandRaised: () => void;
  setVirtualBg: (bg: VirtualBackgroundType) => void;
  sendChatMessage: (text: string, to?: string) => void;
  sendReaction: (emoji: string) => void;
  setViewMode: (mode: 'gallery' | 'speaker') => void;
  setPinnedParticipant: (id: string | null) => void;
  setActiveDrawer: (drawer: 'chat' | 'participants' | 'security' | null) => void;
  setLeaveModalOpen: (open: boolean) => void;
  setVirtualBgModalOpen: (open: boolean) => void;
  setInfoModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  muteAllParticipants: () => void;
  updateSecuritySetting: (key: keyof ISecuritySettings, value: boolean) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetingId: '',
  title: 'OmniSync Video Meeting',
  hostId: '',
  hostName: '',
  passcode: '482910',
  isHost: false,
  isInLobby: true,
  isJoined: false,

  localStream: null,
  screenStream: null,
  isAudioMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  virtualBg: 'none',

  isRecording: false,
  recordingDuration: 0,
  recorder: new MeetingRecorder(),
  recordingInterval: null,

  participants: [],
  activeSpeakerId: null,
  pinnedParticipantId: null,
  isHandRaised: false,

  viewMode: 'gallery',
  activeDrawer: null,
  isLeaveModalOpen: false,
  isWhiteboardOpen: false,
  isVirtualBgModalOpen: false,
  isInfoModalOpen: false,
  isShortcutsModalOpen: false,
  unreadChatCount: 0,

  chatMessages: [],
  floatingReactions: [],
  securitySettings: {
    lockMeeting: false,
    allowShareScreen: true,
    allowChat: true,
    allowRename: true,
    allowUnmute: true,
  },

  initLobby: async (meetingId, currentUser) => {
    // Acquire local stream for pre-meeting test
    const stream = await MediaService.getLocalStream({ video: true, audio: true });

    const cleanId = meetingId.replace(/-/g, '');
    const formattedId =
      cleanId.length === 9
        ? `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`
        : meetingId;

    const isHost = !get().hostId || get().hostId === currentUser._id;

    set({
      meetingId: formattedId,
      title: `${currentUser.name}'s Meeting Room`,
      hostId: currentUser._id,
      hostName: currentUser.name,
      isHost,
      isInLobby: true,
      isJoined: false,
      localStream: stream,
      isAudioMuted: false,
      isVideoOff: false,
    });
  },

  joinMeeting: async (currentUser) => {
    const { meetingId, title, isAudioMuted, isVideoOff, localStream } = get();
    const socket = socketService.getSocket();

    // Play pleasant entrance chime
    soundEffects.playJoinChime();

    // Create self participant
    const selfParticipant: IParticipant = {
      id: 'self',
      socketId: socket?.id || 'self-socket',
      userId: currentUser._id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      isHost: true,
      isAudioOn: !isAudioMuted,
      isVideoOn: !isVideoOff,
      isScreenSharing: false,
      isHandRaised: false,
      stream: localStream,
      isSpeaking: false,
    };

    // Pre-populate with realistic colleagues for rich active conference testing!
    const simulatedParticipants: IParticipant[] = [
      {
        id: 'sim-1',
        socketId: 'sim-socket-1',
        userId: 'demo-friend-1',
        name: 'Sarah Chen (Staff AI Engineer)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
        isHost: false,
        isAudioOn: true,
        isVideoOn: true,
        isScreenSharing: false,
        isHandRaised: false,
        isSpeaking: true,
        isSimulated: true,
      },
      {
        id: 'sim-2',
        socketId: 'sim-socket-2',
        userId: 'demo-friend-2',
        name: 'David Kim (Product Design Lead)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
        isHost: false,
        isAudioOn: true,
        isVideoOn: true,
        isScreenSharing: false,
        isHandRaised: false,
        isSpeaking: false,
        isSimulated: true,
      },
      {
        id: 'sim-3',
        socketId: 'sim-socket-3',
        userId: 'demo-friend-4',
        name: 'Marcus Vance (Senior Architect)',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
        isHost: false,
        isAudioOn: false,
        isVideoOn: true,
        isScreenSharing: false,
        isHandRaised: false,
        isSpeaking: false,
        isSimulated: true,
      },
    ];

    const initialMessages: IMeetingChatMessage[] = [
      {
        id: 'init-msg-1',
        senderId: 'demo-friend-1',
        senderName: 'Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
        text: 'Welcome to the Zoom conference room! Audio & video streams are streaming smoothly.',
        timestamp: 'Just now',
        to: 'everyone',
      },
    ];

    set({
      isInLobby: false,
      isJoined: true,
      participants: [selfParticipant, ...simulatedParticipants],
      activeSpeakerId: 'sim-1',
      chatMessages: initialMessages,
    });

    // Notify backend socket room
    if (socket) {
      socket.emit('meeting:join', {
        meetingId,
        title,
        user: {
          id: currentUser._id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        isAudioOn: !isAudioMuted,
        isVideoOn: !isVideoOff,
      });

      // Register live listeners
      socket.on('meeting:user-joined', (data: { participant: any }) => {
        soundEffects.playJoinChime();
        set((state) => {
          const exists = state.participants.some((p) => p.socketId === data.participant.socketId);
          if (exists) return state;
          return {
            participants: [
              ...state.participants,
              {
                id: data.participant.socketId,
                socketId: data.participant.socketId,
                userId: data.participant.userId,
                name: data.participant.name,
                avatar: data.participant.avatar,
                isHost: data.participant.isHost,
                isAudioOn: data.participant.isAudioOn,
                isVideoOn: data.participant.isVideoOn,
                isScreenSharing: false,
                isHandRaised: false,
              },
            ],
          };
        });
      });

      socket.on('meeting:user-left', (data: { socketId: string; name: string }) => {
        soundEffects.playLeaveChime();
        set((state) => ({
          participants: state.participants.filter((p) => p.socketId !== data.socketId),
        }));
      });

      socket.on('meeting:participant-updated', (data: { socketId: string; type: string; enabled: boolean }) => {
        set((state) => ({
          participants: state.participants.map((p) => {
            if (p.socketId === data.socketId) {
              if (data.type === 'audio') return { ...p, isAudioOn: data.enabled };
              if (data.type === 'video') return { ...p, isVideoOn: data.enabled };
              if (data.type === 'screen') return { ...p, isScreenSharing: data.enabled };
            }
            return p;
          }),
        }));
      });

      socket.on('meeting:new-chat-message', (message: IMeetingChatMessage) => {
        soundEffects.playMessagePop();
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
          unreadChatCount: state.activeDrawer === 'chat' ? 0 : state.unreadChatCount + 1,
        }));
      });

      socket.on('meeting:reaction-received', (data: { name: string; emoji: string }) => {
        const reaction: IFloatingReaction = {
          id: `react_${Date.now()}_${Math.random()}`,
          emoji: data.emoji,
          senderName: data.name,
          xPos: 20 + Math.random() * 60,
        };

        set((state) => ({
          floatingReactions: [...state.floatingReactions, reaction],
        }));

        setTimeout(() => {
          set((state) => ({
            floatingReactions: state.floatingReactions.filter((r) => r.id !== reaction.id),
          }));
        }, 3000);
      });

      socket.on('meeting:hand-status', (data: { socketId: string; raised: boolean }) => {
        if (data.raised) soundEffects.playHandRaiseSound();
        set((state) => ({
          participants: state.participants.map((p) =>
            p.socketId === data.socketId ? { ...p, isHandRaised: data.raised } : p
          ),
        }));
      });

      socket.on('meeting:host-muted-all', () => {
        const stream = get().localStream;
        if (stream) {
          stream.getAudioTracks().forEach((track) => (track.enabled = false));
        }
        set({ isAudioMuted: true });
      });
    }
  },

  leaveMeeting: (endForAll = false) => {
    const { localStream, screenStream, recorder, recordingInterval, meetingId } = get();
    const socket = socketService.getSocket();

    // Stop streams
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }

    // Stop recording if active
    recorder.stop();
    if (recordingInterval) clearInterval(recordingInterval);

    // Notify socket
    if (socket) {
      socket.emit('meeting:leave', { meetingId, endForAll });
      socket.off('meeting:user-joined');
      socket.off('meeting:user-left');
      socket.off('meeting:participant-updated');
      socket.off('meeting:new-chat-message');
      socket.off('meeting:reaction-received');
      socket.off('meeting:hand-status');
      socket.off('meeting:host-muted-all');
    }

    set({
      isInLobby: true,
      isJoined: false,
      localStream: null,
      screenStream: null,
      isRecording: false,
      recordingDuration: 0,
      participants: [],
      chatMessages: [],
      isLeaveModalOpen: false,
      isWhiteboardOpen: false,
    });
  },

  toggleAudio: () => {
    const { localStream, isAudioMuted, meetingId } = get();
    const newMuted = !isAudioMuted;

    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    set((state) => ({
      isAudioMuted: newMuted,
      participants: state.participants.map((p) =>
        p.id === 'self' ? { ...p, isAudioOn: !newMuted } : p
      ),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:toggle-media', {
        meetingId,
        type: 'audio',
        enabled: !newMuted,
      });
    }
  },

  toggleVideo: async () => {
    const { localStream, isVideoOff, meetingId } = get();
    const newVideoOff = !isVideoOff;

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOff;
      });
    }

    set((state) => ({
      isVideoOff: newVideoOff,
      participants: state.participants.map((p) =>
        p.id === 'self' ? { ...p, isVideoOn: !newVideoOff } : p
      ),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:toggle-media', {
        meetingId,
        type: 'video',
        enabled: !newVideoOff,
      });
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream, screenStream, meetingId } = get();

    if (!isScreenSharing) {
      const displayStream = await MediaService.getDisplayStream();
      if (!displayStream) return;

      displayStream.getVideoTracks()[0].onended = () => {
        get().toggleScreenShare();
      };

      set((state) => ({
        screenStream: displayStream,
        isScreenSharing: true,
        participants: state.participants.map((p) =>
          p.id === 'self' ? { ...p, isScreenSharing: true, stream: displayStream } : p
        ),
      }));

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('meeting:toggle-media', {
          meetingId,
          type: 'screen',
          enabled: true,
        });
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }

      set((state) => ({
        screenStream: null,
        isScreenSharing: false,
        participants: state.participants.map((p) =>
          p.id === 'self' ? { ...p, isScreenSharing: false, stream: localStream } : p
        ),
      }));

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('meeting:toggle-media', {
          meetingId,
          type: 'screen',
          enabled: false,
        });
      }
    }
  },

  toggleWhiteboard: () => {
    set((state) => ({ isWhiteboardOpen: !state.isWhiteboardOpen }));
  },

  toggleRecord: () => {
    const { isRecording, recorder, localStream, screenStream, meetingId } = get();

    if (!isRecording) {
      const streamToRecord = screenStream || localStream;
      if (!streamToRecord) return;

      const started = recorder.start(streamToRecord, meetingId);
      if (started) {
        const interval = setInterval(() => {
          set({ recordingDuration: recorder.getDurationSeconds() });
        }, 1000);

        set({
          isRecording: true,
          recordingDuration: 0,
          recordingInterval: interval,
        });
      }
    } else {
      recorder.stop();
      const interval = get().recordingInterval;
      if (interval) clearInterval(interval);

      set({
        isRecording: false,
        recordingDuration: 0,
        recordingInterval: null,
      });
    }
  },

  toggleHandRaised: () => {
    const { isHandRaised, meetingId } = get();
    const nextHand = !isHandRaised;

    if (nextHand) soundEffects.playHandRaiseSound();

    set((state) => ({
      isHandRaised: nextHand,
      participants: state.participants.map((p) =>
        p.id === 'self' ? { ...p, isHandRaised: nextHand } : p
      ),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:raise-hand', { meetingId, raised: nextHand });
    }
  },

  setVirtualBg: (bg) => set({ virtualBg: bg }),

  sendChatMessage: (text, to = 'everyone') => {
    const { meetingId, participants } = get();
    const self = participants.find((p) => p.id === 'self');
    if (!self || !text.trim()) return;

    const message: IMeetingChatMessage = {
      id: `mmsg_${Date.now()}_${Math.random()}`,
      senderId: self.userId,
      senderName: self.name,
      senderAvatar: self.avatar,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      to,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:chat-message', { meetingId, text });
    }
  },

  sendReaction: (emoji) => {
    const { meetingId, participants } = get();
    const self = participants.find((p) => p.id === 'self');
    const senderName = self?.name || 'You';

    const reaction: IFloatingReaction = {
      id: `react_${Date.now()}_${Math.random()}`,
      emoji,
      senderName,
      xPos: 20 + Math.random() * 60,
    };

    set((state) => ({
      floatingReactions: [...state.floatingReactions, reaction],
    }));

    setTimeout(() => {
      set((state) => ({
        floatingReactions: state.floatingReactions.filter((r) => r.id !== reaction.id),
      }));
    }, 3000);

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:reaction', { meetingId, emoji });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setPinnedParticipant: (id) => set({ pinnedParticipantId: id }),

  setActiveDrawer: (drawer) => {
    set((state) => ({
      activeDrawer: state.activeDrawer === drawer ? null : drawer,
      unreadChatCount: drawer === 'chat' ? 0 : state.unreadChatCount,
    }));
  },

  setLeaveModalOpen: (open) => set({ isLeaveModalOpen: open }),
  setVirtualBgModalOpen: (open) => set({ isVirtualBgModalOpen: open }),
  setInfoModalOpen: (open) => set({ isInfoModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),

  muteAllParticipants: () => {
    const { meetingId } = get();
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id !== 'self' ? { ...p, isAudioOn: false } : p
      ),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:mute-all', { meetingId });
    }
  },

  updateSecuritySetting: (key, value) => {
    set((state) => ({
      securitySettings: {
        ...state.securitySettings,
        [key]: value,
      },
    }));
  },
}));
