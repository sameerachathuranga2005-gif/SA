import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { isOriginAllowed } from '../config/cors.js';
import { IMeetingRoom, IMeetingParticipant } from '../types/index.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  currentRoomId?: string;
}

interface RoomPeer {
  socketId: string;
  userId: string;
  userName: string;
  avatar: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
}

class SocketManager {
  private io: Server | null = null;
  // Map of userId -> Set of active socket IDs
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of roomId -> Map of socketId -> RoomPeer
  private rooms: Map<string, Map<string, RoomPeer>> = new Map();
  // Map of meetingId -> IMeetingRoom details (metadata)
  private meetingRooms: Map<string, IMeetingRoom> = new Map();

  public registerMeeting(
    meetingId: string,
    data: { title: string; hostId: string; hostName: string; passcode: string }
  ): IMeetingRoom {
    const cleanId = meetingId.replace(/-/g, '');
    const room: IMeetingRoom = {
      meetingId: cleanId,
      title: data.title,
      hostId: data.hostId,
      hostName: data.hostName,
      passcode: data.passcode,
      createdAt: new Date(),
      isLocked: false,
      waitingRoomEnabled: false,
      participants: new Map(),
      waitingParticipants: new Map(),
    };
    this.meetingRooms.set(cleanId, room);
    return room;
  }

  public getMeetingRoom(meetingId: string): IMeetingRoom | undefined {
    const cleanId = meetingId.replace(/-/g, '');
    return this.meetingRooms.get(cleanId);
  }

  public initialize(httpServer: HttpServer, _clientUrl?: string) {
    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            console.warn(`[CORS] Blocked Socket.io connection from origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // JWT & Firebase Authentication Middleware for WebSockets
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        const authPayload = socket.handshake.auth || {};
        const fallbackUid = authPayload.uid || authPayload.userId;
        const fallbackEmail = authPayload.email;

        // 1. If backend JWT is provided, attempt to verify it
        if (token) {
          try {
            const decoded = verifyToken(token);
            socket.userId = decoded.userId;
            socket.userEmail = decoded.email;
            return next();
          } catch (_err) {
            // Token is not a local backend JWT (e.g. Firebase ID token or demo token)
          }
        }

        // 2. Allow connections that pass valid user metadata (Firebase or Demo login)
        if (fallbackUid) {
          socket.userId = String(fallbackUid);
          socket.userEmail = fallbackEmail ? String(fallbackEmail) : `${fallbackUid}@user.local`;
          return next();
        }

        return next(new Error('Authentication error: Missing token or user metadata'));
      } catch (err: any) {
        return next(new Error('Authentication error: Invalid credentials'));
      }
    });

    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      if (!userId) return;

      console.log(`[Socket] Client connected: user=${userId}, socket=${socket.id}`);

      // Track socket ID
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join individual user room for private alerts
      socket.join(`user:${userId}`);

      // Update online status in database
      await UserService.setUserOnlineStatus(userId, true);

      // Broadcast user online event to all connected clients
      this.io?.emit('user-online', {
        userId,
        isOnline: true,
      });

      // ==========================================
      // REAL-TIME WebRTC SIGNALING SPECIFICATION
      // ==========================================

      // 1. Join Room: (roomId, userId, userName, avatar, passcode, isAudioOn, isVideoOn)
      socket.on(
        'join-room',
        (data: {
          roomId: string;
          userId: string;
          userName: string;
          avatar?: string;
          passcode?: string;
          isAudioOn?: boolean;
          isVideoOn?: boolean;
        }) => {
          const { roomId, userId: peerUserId, userName, avatar, passcode: providedPasscode, isAudioOn = true, isVideoOn = true } = data;
          const cleanRoomId = roomId.replace(/-/g, '');
          const currentUserId = peerUserId || userId;

          // Check or create room metadata
          let room = this.meetingRooms.get(cleanRoomId);
          if (!room) {
            // Room does not exist yet -> Current user becomes the Host!
            const generatedPasscode = providedPasscode || Math.floor(100000 + Math.random() * 900000).toString();
            room = {
              meetingId: cleanRoomId,
              title: `${userName}'s Video Meeting`,
              hostId: currentUserId,
              hostName: userName,
              hostSocketId: socket.id,
              passcode: generatedPasscode,
              createdAt: new Date(),
              isLocked: false,
              waitingRoomEnabled: false,
              participants: new Map(),
              waitingParticipants: new Map(),
            };
            this.meetingRooms.set(cleanRoomId, room);
          }

          const isHost = room.hostId === currentUserId || room.hostSocketId === socket.id;
          if (isHost) {
            room.hostSocketId = socket.id;
          }

          // If participant is NOT host, enforce Passcode verification
          if (!isHost) {
            if (!providedPasscode || providedPasscode.trim() !== room.passcode.trim()) {
              console.warn(`[Meeting Security] Rejected join for ${userName} (${socket.id}) in room ${cleanRoomId}: Invalid Passcode`);
              socket.emit('meeting:error', {
                code: 'INVALID_PASSCODE',
                message: 'Invalid Meeting Passcode. Please enter the correct 6-digit passcode to join.',
              });
              return;
            }

            // Check Waiting Room
            if (room.waitingRoomEnabled) {
              console.log(`[Meeting Security] ${userName} (${socket.id}) placed in waiting room for ${cleanRoomId}`);
              const waitingUser = {
                socketId: socket.id,
                userId: currentUserId,
                userName: userName || 'Participant',
                avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName || 'User')}`,
                joinedAt: new Date(),
              };
              room.waitingParticipants.set(socket.id, waitingUser);

              socket.emit('meeting:waiting-room', {
                inWaitingRoom: true,
                message: 'Please wait, the meeting host will let you in soon.',
                title: room.title,
                meetingId: cleanRoomId,
              });

              if (room.hostSocketId) {
                this.io?.to(room.hostSocketId).emit('meeting:waiting-room-updated', {
                  waitingUsers: Array.from(room.waitingParticipants.values()),
                });
              }
              return;
            }
          }

          // Admitted to room
          socket.currentRoomId = cleanRoomId;
          socket.join(`room:${cleanRoomId}`);

          if (!this.rooms.has(cleanRoomId)) {
            this.rooms.set(cleanRoomId, new Map());
          }
          const roomPeers = this.rooms.get(cleanRoomId)!;

          // Existing participants in the room
          const existingPeers: RoomPeer[] = Array.from(roomPeers.values()).filter(
            (p) => p.socketId !== socket.id
          );

          const currentPeer: RoomPeer = {
            socketId: socket.id,
            userId: currentUserId,
            userName: userName || 'Participant',
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName || 'User')}`,
            isAudioOn,
            isVideoOn,
            isScreenSharing: false,
            isHandRaised: false,
          };

          roomPeers.set(socket.id, currentPeer);

          // Emit room joined confirmation with security metadata
          socket.emit('meeting:room-joined', {
            isHost,
            passcode: room.passcode,
            title: room.title,
            hostId: room.hostId,
            hostName: room.hostName,
            waitingRoomEnabled: room.waitingRoomEnabled,
          });

          // Send back list of existing participants to caller so they can initiate WebRTC offers
          socket.emit('room-users', {
            roomId: cleanRoomId,
            users: existingPeers,
          });

          // Notify existing room participants that a new user connected
          socket.to(`room:${cleanRoomId}`).emit('user-connected', currentPeer);

          // If user is host, send waiting room roster
          if (isHost && room.waitingParticipants.size > 0) {
            socket.emit('meeting:waiting-room-updated', {
              waitingUsers: Array.from(room.waitingParticipants.values()),
            });
          }

          console.log(`[WebRTC] ${currentPeer.userName} (${socket.id}) joined room ${cleanRoomId} [Host: ${isHost}]. Peers: ${roomPeers.size}`);
        }
      );

      // 2. WebRTC SDP Offer forwarding: (targetSocketId, sdp, callerInfo)
      socket.on(
        'offer',
        (data: {
          targetSocketId: string;
          sdp: any;
          callerInfo?: any;
        }) => {
          const { targetSocketId, sdp, callerInfo } = data;
          this.io?.to(targetSocketId).emit('offer', {
            callerSocketId: socket.id,
            sdp,
            callerInfo: callerInfo || {
              socketId: socket.id,
              userId,
            },
          });
        }
      );

      // 3. WebRTC SDP Answer forwarding: (targetSocketId, sdp)
      socket.on(
        'answer',
        (data: {
          targetSocketId: string;
          sdp: any;
        }) => {
          const { targetSocketId, sdp } = data;
          this.io?.to(targetSocketId).emit('answer', {
            senderSocketId: socket.id,
            sdp,
          });
        }
      );

      // 4. WebRTC ICE Candidate exchange: (targetSocketId, candidate)
      socket.on(
        'ice-candidate',
        (data: {
          targetSocketId: string;
          candidate: any;
        }) => {
          const { targetSocketId, candidate } = data;
          this.io?.to(targetSocketId).emit('ice-candidate', {
            senderSocketId: socket.id,
            candidate,
          });
        }
      );

      // 5. Media State Toggle: (roomId, userId, mediaType, isEnabled)
      socket.on(
        'toggle-media',
        (data: {
          roomId: string;
          userId: string;
          mediaType: 'audio' | 'video' | 'screen';
          isEnabled: boolean;
        }) => {
          const { roomId, userId: peerUserId, mediaType, isEnabled } = data;
          const cleanRoomId = roomId.replace(/-/g, '');
          const roomPeers = this.rooms.get(cleanRoomId);

          if (roomPeers && roomPeers.has(socket.id)) {
            const peer = roomPeers.get(socket.id)!;
            if (mediaType === 'audio') peer.isAudioOn = isEnabled;
            if (mediaType === 'video') peer.isVideoOn = isEnabled;
            if (mediaType === 'screen') peer.isScreenSharing = isEnabled;
          }

          // Broadcast to all other participants in the room
          socket.to(`room:${cleanRoomId}`).emit('user-media-toggled', {
            socketId: socket.id,
            userId: peerUserId || userId,
            mediaType,
            isEnabled,
          });
        }
      );

      // 6. Leave Room: (roomId)
      socket.on('leave-room', (data: { roomId?: string }) => {
        const roomId = data?.roomId || socket.currentRoomId;
        if (roomId) {
          this.handleRoomLeave(socket, roomId);
        }
      });

      // Backward compatible legacy events
      socket.on('meeting:join', (data: any) => {
        socket.emit('meeting:existing-participants', {
          roomInfo: { meetingId: data.meetingId, title: data.title },
          participants: [],
        });
      });

      // In-Meeting Chat Message (Everyone or Direct Message)
      socket.on(
        'meeting:chat-message',
        (data: {
          meetingId: string;
          text: string;
          to?: string;
          recipientSocketId?: string;
          recipientName?: string;
        }) => {
          const { meetingId, text, to = 'Everyone', recipientSocketId, recipientName } = data;
          const cleanRoomId = meetingId.replace(/-/g, '');
          const roomPeers = this.rooms.get(cleanRoomId);
          const sender = roomPeers?.get(socket.id);

          const isDirect = !!recipientSocketId && recipientSocketId !== 'everyone';

          const message = {
            id: `mmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            senderId: userId,
            senderName: sender?.userName || 'Participant',
            senderAvatar: sender?.avatar || '',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            to: isDirect ? recipientName || to : 'Everyone',
            recipientSocketId: isDirect ? recipientSocketId : undefined,
            isDirect,
          };

          if (isDirect && recipientSocketId) {
            // Send privately to target recipient AND echo back to sender
            this.io?.to(recipientSocketId).emit('meeting:new-chat-message', message);
            socket.emit('meeting:new-chat-message', message);
            console.log(`[Meeting Chat] Direct message from ${message.senderName} to ${message.to}`);
          } else {
            // Broadcast to everyone in the room
            this.io?.to(`room:${cleanRoomId}`).emit('meeting:new-chat-message', message);
            console.log(`[Meeting Chat] Public message from ${message.senderName} to room ${cleanRoomId}`);
          }
        }
      );

      // Waiting Room: Host Toggles Waiting Room
      socket.on('meeting:toggle-waiting-room', (data: { roomId: string; enabled: boolean }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (room && (room.hostId === userId || room.hostSocketId === socket.id)) {
          room.waitingRoomEnabled = data.enabled;
          this.io?.to(`room:${cleanRoomId}`).emit('meeting:security-updated', {
            waitingRoomEnabled: data.enabled,
          });
          console.log(`[Host Controls] Waiting room ${data.enabled ? 'enabled' : 'disabled'} for ${cleanRoomId}`);
        }
      });

      // Waiting Room: Host Admits Participant
      socket.on('meeting:admit-peer', (data: { roomId: string; targetSocketId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        const waitingPeer = room.waitingParticipants.get(data.targetSocketId);
        if (!waitingPeer) return;

        room.waitingParticipants.delete(data.targetSocketId);

        const targetSocket = this.io?.sockets.sockets.get(data.targetSocketId) as AuthenticatedSocket | undefined;
        if (!targetSocket) return;

        targetSocket.currentRoomId = cleanRoomId;
        targetSocket.join(`room:${cleanRoomId}`);

        if (!this.rooms.has(cleanRoomId)) {
          this.rooms.set(cleanRoomId, new Map());
        }
        const roomPeers = this.rooms.get(cleanRoomId)!;
        const existingPeers: RoomPeer[] = Array.from(roomPeers.values()).filter(
          (p) => p.socketId !== targetSocket.id
        );

        const currentPeer: RoomPeer = {
          socketId: targetSocket.id,
          userId: waitingPeer.userId,
          userName: waitingPeer.userName,
          avatar: waitingPeer.avatar,
          isAudioOn: true,
          isVideoOn: true,
          isScreenSharing: false,
          isHandRaised: false,
        };
        roomPeers.set(targetSocket.id, currentPeer);

        // Notify admitted peer with room users
        targetSocket.emit('meeting:admitted', {
          roomId: cleanRoomId,
          title: room.title,
          hostId: room.hostId,
          hostName: room.hostName,
          passcode: room.passcode,
          users: existingPeers,
        });

        // Notify existing participants
        targetSocket.to(`room:${cleanRoomId}`).emit('user-connected', currentPeer);

        // Update host waiting list
        socket.emit('meeting:waiting-room-updated', {
          waitingUsers: Array.from(room.waitingParticipants.values()),
        });

        console.log(`[Host Controls] Host admitted ${waitingPeer.userName} to ${cleanRoomId}`);
      });

      // Waiting Room: Host Denies Participant
      socket.on('meeting:deny-peer', (data: { roomId: string; targetSocketId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        const waitingPeer = room.waitingParticipants.get(data.targetSocketId);
        if (waitingPeer) {
          room.waitingParticipants.delete(data.targetSocketId);
          this.io?.to(data.targetSocketId).emit('meeting:denied', {
            message: 'The meeting host has denied your request to enter.',
          });
          socket.emit('meeting:waiting-room-updated', {
            waitingUsers: Array.from(room.waitingParticipants.values()),
          });
          console.log(`[Host Controls] Host denied ${waitingPeer.userName}`);
        }
      });

      // Waiting Room: Host Admits All
      socket.on('meeting:admit-all', (data: { roomId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        const waitingSocketIds = Array.from(room.waitingParticipants.keys());
        for (const targetSocketId of waitingSocketIds) {
          const waitingPeer = room.waitingParticipants.get(targetSocketId);
          if (!waitingPeer) continue;

          room.waitingParticipants.delete(targetSocketId);

          const targetSocket = this.io?.sockets.sockets.get(targetSocketId) as AuthenticatedSocket | undefined;
          if (!targetSocket) continue;

          targetSocket.currentRoomId = cleanRoomId;
          targetSocket.join(`room:${cleanRoomId}`);

          if (!this.rooms.has(cleanRoomId)) {
            this.rooms.set(cleanRoomId, new Map());
          }
          const roomPeers = this.rooms.get(cleanRoomId)!;
          const existingPeers: RoomPeer[] = Array.from(roomPeers.values()).filter(
            (p) => p.socketId !== targetSocket.id
          );

          const currentPeer: RoomPeer = {
            socketId: targetSocket.id,
            userId: waitingPeer.userId,
            userName: waitingPeer.userName,
            avatar: waitingPeer.avatar,
            isAudioOn: true,
            isVideoOn: true,
            isScreenSharing: false,
            isHandRaised: false,
          };
          roomPeers.set(targetSocket.id, currentPeer);

          targetSocket.emit('meeting:admitted', {
            roomId: cleanRoomId,
            title: room.title,
            hostId: room.hostId,
            hostName: room.hostName,
            passcode: room.passcode,
            users: existingPeers,
          });

          targetSocket.to(`room:${cleanRoomId}`).emit('user-connected', currentPeer);
        }

        socket.emit('meeting:waiting-room-updated', {
          waitingUsers: [],
        });
      });

      // Host Controls: Mute Individual Participant
      socket.on('meeting:host-mute-peer', (data: { roomId: string; targetSocketId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        this.io?.to(data.targetSocketId).emit('meeting:host-muted-you');

        const roomPeers = this.rooms.get(cleanRoomId);
        const targetPeer = roomPeers?.get(data.targetSocketId);
        if (targetPeer) targetPeer.isAudioOn = false;

        this.io?.to(`room:${cleanRoomId}`).emit('user-media-toggled', {
          socketId: data.targetSocketId,
          userId: targetPeer?.userId,
          mediaType: 'audio',
          isEnabled: false,
        });

        console.log(`[Host Controls] Muted participant ${data.targetSocketId}`);
      });

      // Host Controls: Turn Off Video for Participant
      socket.on('meeting:host-stop-video', (data: { roomId: string; targetSocketId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        this.io?.to(data.targetSocketId).emit('meeting:host-stopped-your-video');

        const roomPeers = this.rooms.get(cleanRoomId);
        const targetPeer = roomPeers?.get(data.targetSocketId);
        if (targetPeer) targetPeer.isVideoOn = false;

        this.io?.to(`room:${cleanRoomId}`).emit('user-media-toggled', {
          socketId: data.targetSocketId,
          userId: targetPeer?.userId,
          mediaType: 'video',
          isEnabled: false,
        });

        console.log(`[Host Controls] Stopped video for participant ${data.targetSocketId}`);
      });

      // Host Controls: Remove (Kick) Participant
      socket.on('meeting:host-kick-peer', (data: { roomId: string; targetSocketId: string }) => {
        const cleanRoomId = data.roomId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        const targetSocket = this.io?.sockets.sockets.get(data.targetSocketId) as AuthenticatedSocket | undefined;
        if (targetSocket) {
          targetSocket.emit('meeting:kicked-by-host', {
            message: 'You have been removed from the meeting by the host.',
          });
          this.handleRoomLeave(targetSocket, cleanRoomId);
          console.log(`[Host Controls] Removed (kicked) participant ${data.targetSocketId}`);
        }
      });

      // Host Controls: Mute All
      socket.on('meeting:mute-all', (data: { meetingId?: string; roomId?: string }) => {
        const rawId = data.meetingId || data.roomId || '';
        const cleanRoomId = rawId.replace(/-/g, '');
        const room = this.meetingRooms.get(cleanRoomId);
        if (!room || (room.hostId !== userId && room.hostSocketId !== socket.id)) return;

        const roomPeers = this.rooms.get(cleanRoomId);
        if (roomPeers) {
          for (const [sId, peer] of roomPeers) {
            if (sId !== socket.id) {
              peer.isAudioOn = false;
              this.io?.to(sId).emit('meeting:host-muted-you');
            }
          }
        }
        socket.to(`room:${cleanRoomId}`).emit('meeting:host-muted-all');
        console.log(`[Host Controls] Host muted all participants in ${cleanRoomId}`);
      });

      // Emoji Reactions
      socket.on('meeting:reaction', (data: { meetingId: string; emoji: string }) => {
        const { meetingId, emoji } = data;
        const cleanRoomId = meetingId.replace(/-/g, '');
        const roomPeers = this.rooms.get(cleanRoomId);
        const sender = roomPeers?.get(socket.id);

        this.io?.to(`room:${cleanRoomId}`).emit('meeting:reaction-received', {
          socketId: socket.id,
          name: sender?.userName || 'Participant',
          emoji,
        });
      });

      // Hand status
      socket.on('meeting:raise-hand', (data: { meetingId: string; raised: boolean }) => {
        const { meetingId, raised } = data;
        const cleanRoomId = meetingId.replace(/-/g, '');
        const roomPeers = this.rooms.get(cleanRoomId);
        const peer = roomPeers?.get(socket.id);
        if (peer) peer.isHandRaised = raised;

        this.io?.to(`room:${cleanRoomId}`).emit('meeting:hand-status', {
          socketId: socket.id,
          userId,
          name: peer?.userName || 'Participant',
          raised,
        });
      });

      // Ping/Pong
      socket.on('ping-keepalive', () => {
        socket.emit('pong-keepalive', { timestamp: Date.now() });
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: user=${userId}, socket=${socket.id}`);

        // Clean up from active room if any
        if (socket.currentRoomId) {
          this.handleRoomLeave(socket, socket.currentRoomId);
        }

        const userSocketSet = this.userSockets.get(userId);

        if (userSocketSet) {
          userSocketSet.delete(socket.id);

          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);

            const lastSeen = new Date();
            await UserService.setUserOnlineStatus(userId, false);

            this.io?.emit('user-offline', {
              userId,
              isOnline: false,
              lastSeen,
            });
          }
        }
      });
    });

    console.log('[Socket] Socket.io server initialized with WebRTC signaling');
  }

  private handleRoomLeave(socket: AuthenticatedSocket, roomId: string) {
    const cleanRoomId = roomId.replace(/-/g, '');
    const roomPeers = this.rooms.get(cleanRoomId);
    const room = this.meetingRooms.get(cleanRoomId);

    // If socket was waiting in the waiting room, remove and notify host
    if (room && room.waitingParticipants.has(socket.id)) {
      room.waitingParticipants.delete(socket.id);
      if (room.hostSocketId) {
        this.io?.to(room.hostSocketId).emit('meeting:waiting-room-updated', {
          waitingUsers: Array.from(room.waitingParticipants.values()),
        });
      }
    }

    if (roomPeers && roomPeers.has(socket.id)) {
      const peer = roomPeers.get(socket.id)!;
      roomPeers.delete(socket.id);

      // Notify others via user-disconnected
      socket.to(`room:${cleanRoomId}`).emit('user-disconnected', {
        socketId: socket.id,
        userId: peer.userId,
        userName: peer.userName,
      });

      socket.leave(`room:${cleanRoomId}`);
      socket.currentRoomId = undefined;

      console.log(`[WebRTC] ${peer.userName} (${socket.id}) left room ${cleanRoomId}. Remaining: ${roomPeers.size}`);

      if (roomPeers.size === 0) {
        this.rooms.delete(cleanRoomId);
      }
    }
  }

  // Send an event to all open tabs/sockets of a specific user
  public emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Check if a user is currently online
  public isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}

export const socketManager = new SocketManager();
