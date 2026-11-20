import { create } from 'zustand';
import { socketService } from '../services/socket';
import { MediaService, MeetingRecorder, webrtcManager } from '../services/webrtc';
import { soundEffects } from '../services/soundEffects';
import { VIRTUAL_BACKGROUND_PRESETS, VirtualBackgroundType } from '../services/videoFilters';
import {
  videoProcessor,
  BackgroundMode,
  IVideoAdjustments,
  DEFAULT_VIDEO_ADJUSTMENTS,
} from '../services/videoProcessor';
import { audioProcessor } from '../services/audioProcessor';
import {
  IParticipant,
  IMeetingChatMessage,
  IFloatingReaction,
  ISecuritySettings,
  IUserSummary,
  IWaitingUser,
} from '../types';
import { useAppStore } from './appStore';

interface MeetingState {
  // Room Info & Security
  meetingId: string;
  title: string;
  hostId: string;
  hostName: string;
  passcode: string;
  enteredPasscode: string;
  passcodeError: string | null;
  isHost: boolean;
  isInLobby: boolean;
  isInWaitingRoom: boolean;
  waitingRoomMessage: string;
  isWaitingRoomEnabled: boolean;
  waitingUsers: IWaitingUser[];
  isJoined: boolean;

  // Media
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  virtualBg: VirtualBackgroundType;
  customBgUrl: string | null;
  videoAdjustments: IVideoAdjustments;
  isProNoiseSuppressionEnabled: boolean;
  isVideoSettingsModalOpen: boolean;

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
  setEnteredPasscode: (code: string) => void;
  toggleWaitingRoom: () => void;
  admitWaitingUser: (socketId: string) => void;
  denyWaitingUser: (socketId: string) => void;
  admitAllWaitingUsers: () => void;
  hostMuteParticipant: (socketId: string) => void;
  hostStopParticipantVideo: (socketId: string) => void;
  hostKickParticipant: (socketId: string) => void;
  initLobby: (meetingId: string, currentUser: IUserSummary, prefillPasscode?: string) => Promise<void>;
  joinMeeting: (currentUser: IUserSummary) => Promise<void>;
  leaveMeeting: (endForAll?: boolean) => void;
  toggleAudio: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleWhiteboard: () => void;
  toggleRecord: () => void;
  toggleHandRaised: () => void;
  setVirtualBg: (bg: VirtualBackgroundType, customUrl?: string) => Promise<void>;
  sendChatMessage: (text: string, to?: string, recipientSocketId?: string) => void;
  sendReaction: (emoji: string) => void;
  setViewMode: (mode: 'gallery' | 'speaker') => void;
  setPinnedParticipant: (id: string | null) => void;
  setActiveDrawer: (drawer: 'chat' | 'participants' | 'security' | null) => void;
  setLeaveModalOpen: (open: boolean) => void;
  setVirtualBgModalOpen: (open: boolean) => void;
  setVideoSettingsModalOpen: (open: boolean) => void;
  updateVideoAdjustments: (adjustments: Partial<IVideoAdjustments>) => void;
  toggleProNoiseSuppression: () => Promise<void>;
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
  enteredPasscode: '',
  passcodeError: null,
  isHost: false,
  isInLobby: true,
  isInWaitingRoom: false,
  waitingRoomMessage: 'Please wait, the meeting host will let you in soon.',
  isWaitingRoomEnabled: false,
  waitingUsers: [],
  isJoined: false,

  localStream: null,
  screenStream: null,
  isAudioMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  virtualBg: 'none',
  customBgUrl: null,
  videoAdjustments: { ...DEFAULT_VIDEO_ADJUSTMENTS },
  isProNoiseSuppressionEnabled: true,
  isVideoSettingsModalOpen: false,

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
    waitingRoom: false,
    allowShareScreen: true,
    allowChat: true,
    allowRename: true,
    allowUnmute: true,
  },

  initLobby: async (meetingId, currentUser, prefillPasscode?: string) => {
    // Acquire local webcam & audio and initialize AI video processor + Pro Audio
    const rawStream = await MediaService.getLocalStream({ video: true, audio: true });
    const stream = (await videoProcessor.setSourceStream(rawStream)) || rawStream;
    audioProcessor.init(rawStream);

    const cleanId = meetingId.replace(/-/g, '');
    const formattedId =
      cleanId.length === 9
        ? `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`
        : meetingId;

    const isHost = !get().hostId || get().hostId === currentUser._id;
    const currentPasscode = get().passcode || Math.floor(100000 + Math.random() * 900000).toString();

    set({
      meetingId: formattedId,
      title: `${currentUser.name}'s Meeting Room`,
      hostId: currentUser._id,
      hostName: currentUser.name,
      passcode: currentPasscode,
      enteredPasscode: prefillPasscode || get().enteredPasscode || '',
      passcodeError: null,
      isHost,
      isInLobby: true,
      isInWaitingRoom: false,
      isJoined: false,
      localStream: stream,
      isAudioMuted: false,
      isVideoOff: false,
    });
  },

  joinMeeting: async (currentUser) => {
    const { meetingId, isAudioMuted, isVideoOff, localStream, enteredPasscode, passcode } = get();
    const socket = socketService.getSocket();
    const cleanRoomId = meetingId.replace(/-/g, '');

    // Reset errors
    set({ passcodeError: null });

    // Play entrance chime
    soundEffects.playJoinChime();

    // Configure WebRTC Manager with local stream
    webrtcManager.setLocalStream(localStream);

    // Initial self participant
    const selfParticipant: IParticipant = {
      id: 'self',
      socketId: socket?.id || 'self-socket',
      userId: currentUser._id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      isHost: get().isHost,
      isAudioOn: !isAudioMuted,
      isVideoOn: !isVideoOff,
      isScreenSharing: false,
      isHandRaised: false,
      stream: localStream,
      isSpeaking: false,
    };

    // Pre-populate with realistic colleagues for local testing
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
    ];

    set({
      participants: [selfParticipant, ...simulatedParticipants],
      activeSpeakerId: 'sim-1',
    });

    // Wire WebRTC Manager Callbacks for remote streams
    webrtcManager.setCallbacks(
      (remoteSocketId: string, remoteStream: MediaStream) => {
        console.log('[WebRTC Store] Attaching remote stream for:', remoteSocketId);
        soundEffects.playJoinChime();
        set((state) => ({
          participants: state.participants.map((p) =>
            p.socketId === remoteSocketId
              ? { ...p, stream: remoteStream, isVideoOn: true, isAudioOn: true }
              : p
          ),
        }));
      },
      (disconnectedSocketId: string) => {
        soundEffects.playLeaveChime();
        set((state) => ({
          participants: state.participants.filter((p) => p.socketId !== disconnectedSocketId),
        }));
      }
    );

    if (socket) {
      // 1. Join Socket room with Passcode
      socket.emit('join-room', {
        roomId: cleanRoomId,
        userId: currentUser._id,
        userName: currentUser.name,
        avatar: currentUser.avatar,
        passcode: enteredPasscode.trim() || passcode.trim(),
        isAudioOn: !isAudioMuted,
        isVideoOn: !isVideoOff,
      });

      // Handle successful room joined
      socket.off('meeting:room-joined');
      socket.on(
        'meeting:room-joined',
        (data: {
          isHost: boolean;
          passcode: string;
          title: string;
          hostId: string;
          hostName: string;
          waitingRoomEnabled?: boolean;
        }) => {
          set((state) => ({
            isHost: data.isHost,
            passcode: data.passcode || state.passcode,
            title: data.title || state.title,
            hostId: data.hostId || state.hostId,
            hostName: data.hostName || state.hostName,
            isWaitingRoomEnabled: !!data.waitingRoomEnabled,
            isInLobby: false,
            isInWaitingRoom: false,
            isJoined: true,
            participants: state.participants.map((p) =>
              p.id === 'self' ? { ...p, isHost: data.isHost } : p
            ),
          }));
        }
      );

      // Handle Waiting Room status (placed in waiting queue)
      socket.off('meeting:waiting-room');
      socket.on(
        'meeting:waiting-room',
        (data: { inWaitingRoom: boolean; message: string; title: string; meetingId: string }) => {
          set({
            isInLobby: false,
            isInWaitingRoom: true,
            isJoined: false,
            waitingRoomMessage: data.message,
            title: data.title,
          });
        }
      );

      // Handle Waiting Room updates (Host sees list of waiting users)
      socket.off('meeting:waiting-room-updated');
      socket.on('meeting:waiting-room-updated', (data: { waitingUsers: IWaitingUser[] }) => {
        set({ waitingUsers: data.waitingUsers || [] });
      });

      // Handle Admitted by Host
      socket.off('meeting:admitted');
      socket.on(
        'meeting:admitted',
        async (data: {
          roomId: string;
          title: string;
          hostId: string;
          hostName: string;
          passcode?: string;
          users: any[];
        }) => {
          soundEffects.playJoinChime();
          useAppStore.getState().showToast('The host has admitted you to the meeting!', 'success');

          const admittedSelf: IParticipant = {
            id: 'self',
            socketId: socket.id || 'self-socket',
            userId: currentUser._id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            isHost: false,
            isAudioOn: !get().isAudioMuted,
            isVideoOn: !get().isVideoOff,
            isScreenSharing: false,
            isHandRaised: false,
            stream: get().localStream,
            isSpeaking: false,
          };

          const newPeers: IParticipant[] = (data.users || [])
            .filter((u) => u.socketId !== socket.id)
            .map((u) => ({
              id: u.socketId,
              socketId: u.socketId,
              userId: u.userId,
              name: u.userName,
              avatar: u.avatar,
              isHost: false,
              isAudioOn: u.isAudioOn ?? true,
              isVideoOn: u.isVideoOn ?? true,
              isScreenSharing: false,
              isHandRaised: false,
            }));

          set({
            isInWaitingRoom: false,
            isInLobby: false,
            isJoined: true,
            title: data.title || get().title,
            hostId: data.hostId || get().hostId,
            hostName: data.hostName || get().hostName,
            participants: [admittedSelf, ...newPeers],
          });

          // Create WebRTC offers to all existing peers
          for (const peer of newPeers) {
            await webrtcManager.createOfferToPeer(peer.socketId, {
              socketId: socket.id,
              userId: currentUser._id,
              userName: currentUser.name,
              avatar: currentUser.avatar,
            });
          }
        }
      );

      // Handle Denied by Host
      socket.off('meeting:denied');
      socket.on('meeting:denied', (data: { message?: string }) => {
        useAppStore.getState().showToast(data?.message || 'The host has denied your request to enter', 'error');
        get().leaveMeeting();
        window.location.href = '/';
      });

      // Handle Host Muting Me
      socket.off('meeting:host-muted-you');
      socket.on('meeting:host-muted-you', () => {
        const stream = get().localStream;
        if (stream) {
          stream.getAudioTracks().forEach((track) => (track.enabled = false));
        }
        set((state) => ({
          isAudioMuted: true,
          participants: state.participants.map((p) => (p.id === 'self' ? { ...p, isAudioOn: false } : p)),
        }));
        useAppStore.getState().showToast('The host has muted your microphone', 'info');
      });

      // Handle Host Turning Off My Camera
      socket.off('meeting:host-stopped-your-video');
      socket.on('meeting:host-stopped-your-video', () => {
        const stream = get().localStream;
        if (stream) {
          stream.getVideoTracks().forEach((track) => (track.enabled = false));
        }
        set((state) => ({
          isVideoOff: true,
          participants: state.participants.map((p) => (p.id === 'self' ? { ...p, isVideoOn: false } : p)),
        }));
        useAppStore.getState().showToast('The host has stopped your camera', 'info');
      });

      // Handle Host Kicking Me
      socket.off('meeting:kicked-by-host');
      socket.on('meeting:kicked-by-host', (data: { message?: string }) => {
        useAppStore.getState().showToast(data?.message || 'You have been removed from the meeting by the host', 'error');
        get().leaveMeeting();
        window.location.href = '/';
      });

      // Handle Passcode or Room Error
      socket.off('meeting:error');
      socket.on('meeting:error', (data: { code: string; message: string }) => {
        useAppStore.getState().showToast(data.message, 'error');
        set({
          passcodeError: data.message,
          isInWaitingRoom: false,
          isInLobby: true,
          isJoined: false,
        });
      });

      // Handle Security Settings Update (Waiting Room)
      socket.off('meeting:security-updated');
      socket.on('meeting:security-updated', (data: { waitingRoomEnabled?: boolean }) => {
        if (typeof data.waitingRoomEnabled === 'boolean') {
          set((state) => ({
            isWaitingRoomEnabled: data.waitingRoomEnabled!,
            securitySettings: { ...state.securitySettings, waitingRoom: data.waitingRoomEnabled! },
          }));
        }
      });

      // 2. Receive list of existing participants in room -> initiate WebRTC SDP offers to all of them
      socket.on('room-users', async (data: { roomId: string; users: any[] }) => {
        console.log('[WebRTC] Received existing room users:', data.users);
        const newParticipants: IParticipant[] = [];

        for (const user of data.users) {
          if (user.socketId === socket.id) continue;

          newParticipants.push({
            id: user.socketId,
            socketId: user.socketId,
            userId: user.userId,
            name: user.userName,
            avatar: user.avatar,
            isHost: false,
            isAudioOn: user.isAudioOn ?? true,
            isVideoOn: user.isVideoOn ?? true,
            isScreenSharing: false,
            isHandRaised: false,
          });

          // Create WebRTC Offer to this existing peer
          await webrtcManager.createOfferToPeer(user.socketId, {
            socketId: socket.id,
            userId: currentUser._id,
            userName: currentUser.name,
            avatar: currentUser.avatar,
          });
        }

        if (newParticipants.length > 0) {
          // Replace simulated participants with real peers
          set((state) => ({
            participants: [
              ...state.participants.filter((p) => !p.isSimulated),
              ...newParticipants,
            ],
          }));
        }
      });

      // 3. User connected event (a new peer entered after us)
      socket.on('user-connected', (peer: any) => {
        console.log('[WebRTC] Remote user connected:', peer);
        soundEffects.playJoinChime();

        set((state) => {
          const exists = state.participants.some((p) => p.socketId === peer.socketId);
          if (exists) return state;

          const newPeer: IParticipant = {
            id: peer.socketId,
            socketId: peer.socketId,
            userId: peer.userId,
            name: peer.userName,
            avatar: peer.avatar,
            isHost: false,
            isAudioOn: peer.isAudioOn ?? true,
            isVideoOn: peer.isVideoOn ?? true,
            isScreenSharing: false,
            isHandRaised: false,
          };

          return {
            participants: [
              ...state.participants.filter((p) => !p.isSimulated),
              newPeer,
            ],
          };
        });
      });

      // 4. WebRTC SDP Offer received from another peer -> respond with SDP Answer
      socket.on('offer', async (data: { callerSocketId: string; sdp: RTCSessionDescriptionInit; callerInfo?: any }) => {
        console.log('[WebRTC] Received offer from:', data.callerSocketId);

        // Ensure caller is present in participants list
        if (data.callerInfo) {
          set((state) => {
            const exists = state.participants.some((p) => p.socketId === data.callerSocketId);
            if (exists) return state;

            const callerPeer: IParticipant = {
              id: data.callerSocketId,
              socketId: data.callerSocketId,
              userId: data.callerInfo.userId || 'peer',
              name: data.callerInfo.userName || 'Teammate',
              avatar: data.callerInfo.avatar || '',
              isHost: false,
              isAudioOn: true,
              isVideoOn: true,
              isScreenSharing: false,
              isHandRaised: false,
            };

            return {
              participants: [
                ...state.participants.filter((p) => !p.isSimulated),
                callerPeer,
              ],
            };
          });
        }

        await webrtcManager.handleIncomingOffer(data.callerSocketId, data.sdp);
      });

      // 5. WebRTC SDP Answer received
      socket.on('answer', async (data: { senderSocketId: string; sdp: RTCSessionDescriptionInit }) => {
        console.log('[WebRTC] Received answer from:', data.senderSocketId);
        await webrtcManager.handleIncomingAnswer(data.senderSocketId, data.sdp);
      });

      // 6. WebRTC ICE Candidate received
      socket.on('ice-candidate', async (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
        await webrtcManager.handleIncomingIceCandidate(data.senderSocketId, data.candidate);
      });

      // 7. Remote user toggled media (mic / camera / screen)
      socket.on('user-media-toggled', (data: { socketId: string; userId: string; mediaType: string; isEnabled: boolean }) => {
        set((state) => ({
          participants: state.participants.map((p) => {
            if (p.socketId === data.socketId) {
              if (data.mediaType === 'audio') return { ...p, isAudioOn: data.isEnabled };
              if (data.mediaType === 'video') return { ...p, isVideoOn: data.isEnabled };
              if (data.mediaType === 'screen') return { ...p, isScreenSharing: data.isEnabled };
            }
            return p;
          }),
        }));
      });

      // 8. Remote user disconnected
      socket.on('user-disconnected', (data: { socketId: string; userId: string }) => {
        console.log('[WebRTC] User disconnected:', data.socketId);
        webrtcManager.closePeerConnection(data.socketId);
        soundEffects.playLeaveChime();

        set((state) => ({
          participants: state.participants.filter((p) => p.socketId !== data.socketId),
        }));
      });

      // In-Meeting Chat & Collaboration
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

  leaveMeeting: () => {
    const { screenStream, recorder, recordingInterval, meetingId } = get();
    const socket = socketService.getSocket();
    const cleanRoomId = meetingId.replace(/-/g, '');

    // Close WebRTC peer connections, video processor, and local media tracks
    webrtcManager.closeAll();
    videoProcessor.stop();

    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }

    // Stop recording
    recorder.stop();
    if (recordingInterval) clearInterval(recordingInterval);

    // Notify socket signaling server
    if (socket) {
      socket.emit('leave-room', { roomId: cleanRoomId });
      socket.off('room-users');
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-media-toggled');
      socket.off('user-disconnected');
      socket.off('meeting:new-chat-message');
      socket.off('meeting:reaction-received');
      socket.off('meeting:hand-status');
      socket.off('meeting:host-muted-all');
      socket.off('meeting:room-joined');
      socket.off('meeting:waiting-room');
      socket.off('meeting:waiting-room-updated');
      socket.off('meeting:admitted');
      socket.off('meeting:denied');
      socket.off('meeting:host-muted-you');
      socket.off('meeting:host-stopped-your-video');
      socket.off('meeting:kicked-by-host');
      socket.off('meeting:error');
      socket.off('meeting:security-updated');
    }

    set({
      isInLobby: true,
      isInWaitingRoom: false,
      waitingUsers: [],
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
    const cleanRoomId = meetingId.replace(/-/g, '');

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
      socket.emit('toggle-media', {
        roomId: cleanRoomId,
        mediaType: 'audio',
        isEnabled: !newMuted,
      });
    }
  },

  toggleVideo: async () => {
    const { localStream, isVideoOff, meetingId } = get();
    const newVideoOff = !isVideoOff;
    const cleanRoomId = meetingId.replace(/-/g, '');

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
      socket.emit('toggle-media', {
        roomId: cleanRoomId,
        mediaType: 'video',
        isEnabled: !newVideoOff,
      });
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream, screenStream, meetingId } = get();
    const cleanRoomId = meetingId.replace(/-/g, '');

    if (!isScreenSharing) {
      const displayStream = await MediaService.getDisplayStream();
      if (!displayStream) return;

      const screenTrack = displayStream.getVideoTracks()[0];

      // Handle user ending screen share from browser top bar
      screenTrack.onended = () => {
        get().toggleScreenShare();
      };

      // Replace video track in all active WebRTC peer connections!
      await webrtcManager.replaceVideoTrack(screenTrack);

      set((state) => ({
        screenStream: displayStream,
        isScreenSharing: true,
        participants: state.participants.map((p) =>
          p.id === 'self' ? { ...p, isScreenSharing: true, stream: displayStream } : p
        ),
      }));

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('toggle-media', {
          roomId: cleanRoomId,
          mediaType: 'screen',
          isEnabled: true,
        });
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }

      // Revert video track back to webcam in all WebRTC peer connections
      const originalCamTrack = localStream ? localStream.getVideoTracks()[0] : null;
      if (originalCamTrack) {
        await webrtcManager.replaceVideoTrack(originalCamTrack);
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
        socket.emit('toggle-media', {
          roomId: cleanRoomId,
          mediaType: 'screen',
          isEnabled: false,
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

  setVirtualBg: async (bg, customUrl) => {
    set({ virtualBg: bg });
    if (customUrl) {
      set({ customBgUrl: customUrl });
    }

    let mode: BackgroundMode = 'none';
    let imageUrl: string | undefined = undefined;

    if (bg === 'blur-soft' || bg === 'blur-light') {
      mode = 'blur-soft';
    } else if (bg === 'blur-strong' || bg === 'blur-heavy') {
      mode = 'blur-strong';
    } else if (bg === 'custom') {
      mode = 'image';
      imageUrl = customUrl || get().customBgUrl || undefined;
    } else if (bg !== 'none') {
      mode = 'image';
      const preset = VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === bg);
      imageUrl = preset?.imageUrl;
    }

    await videoProcessor.updateSettings({ mode, imageUrl });

    // Seamlessly update outgoing video track across all active peer connections
    const activeTrack = videoProcessor.getOutputVideoTrack();
    if (activeTrack) {
      await webrtcManager.replaceVideoTrack(activeTrack);
    }
  },

  setEnteredPasscode: (code: string) => set({ enteredPasscode: code, passcodeError: null }),

  toggleWaitingRoom: () => {
    const { meetingId, isWaitingRoomEnabled } = get();
    const next = !isWaitingRoomEnabled;
    set((state) => ({
      isWaitingRoomEnabled: next,
      securitySettings: { ...state.securitySettings, waitingRoom: next },
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:toggle-waiting-room', {
        roomId: meetingId.replace(/-/g, ''),
        enabled: next,
      });
    }
  },

  admitWaitingUser: (socketId: string) => {
    const { meetingId } = get();
    set((state) => ({
      waitingUsers: state.waitingUsers.filter((u) => u.socketId !== socketId),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:admit-peer', {
        roomId: meetingId.replace(/-/g, ''),
        targetSocketId: socketId,
      });
    }
  },

  denyWaitingUser: (socketId: string) => {
    const { meetingId } = get();
    set((state) => ({
      waitingUsers: state.waitingUsers.filter((u) => u.socketId !== socketId),
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:deny-peer', {
        roomId: meetingId.replace(/-/g, ''),
        targetSocketId: socketId,
      });
    }
  },

  admitAllWaitingUsers: () => {
    const { meetingId } = get();
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:admit-all', {
        roomId: meetingId.replace(/-/g, ''),
      });
    }
    set({ waitingUsers: [] });
  },

  hostMuteParticipant: (socketId: string) => {
    const { meetingId } = get();
    set((state) => ({
      participants: state.participants.map((p) =>
        p.socketId === socketId ? { ...p, isAudioOn: false } : p
      ),
    }));
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:host-mute-peer', {
        roomId: meetingId.replace(/-/g, ''),
        targetSocketId: socketId,
      });
    }
  },

  hostStopParticipantVideo: (socketId: string) => {
    const { meetingId } = get();
    set((state) => ({
      participants: state.participants.map((p) =>
        p.socketId === socketId ? { ...p, isVideoOn: false } : p
      ),
    }));
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:host-stop-video', {
        roomId: meetingId.replace(/-/g, ''),
        targetSocketId: socketId,
      });
    }
  },

  hostKickParticipant: (socketId: string) => {
    const { meetingId } = get();
    set((state) => ({
      participants: state.participants.filter((p) => p.socketId !== socketId),
    }));
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:host-kick-peer', {
        roomId: meetingId.replace(/-/g, ''),
        targetSocketId: socketId,
      });
    }
  },

  sendChatMessage: (text: string, to = 'Everyone', recipientSocketId?: string) => {
    const { meetingId, participants } = get();
    const self = participants.find((p) => p.id === 'self');
    if (!self || !text.trim()) return;

    const isDirect = !!recipientSocketId && recipientSocketId !== 'everyone';

    const message: IMeetingChatMessage = {
      id: `mmsg_${Date.now()}_${Math.random()}`,
      senderId: self.userId,
      senderName: self.name,
      senderAvatar: self.avatar,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      to: isDirect ? to : 'Everyone',
      recipientSocketId: isDirect ? recipientSocketId : undefined,
      isDirect,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    }));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('meeting:chat-message', {
        meetingId,
        text: text.trim(),
        to: isDirect ? to : 'Everyone',
        recipientSocketId: isDirect ? recipientSocketId : undefined,
        recipientName: isDirect ? to : undefined,
      });
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
  setVideoSettingsModalOpen: (open) => set({ isVideoSettingsModalOpen: open }),
  updateVideoAdjustments: (adjustments) => {
    videoProcessor.setAdjustments(adjustments);
    set({ videoAdjustments: videoProcessor.getAdjustments() });
  },
  toggleProNoiseSuppression: async () => {
    const next = !get().isProNoiseSuppressionEnabled;
    set({ isProNoiseSuppressionEnabled: next });
    const newTrack = audioProcessor.setProNoiseSuppression(next);
    if (newTrack) {
      await webrtcManager.replaceAudioTrack(newTrack);
    }
  },
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
