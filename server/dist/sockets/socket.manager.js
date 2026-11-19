"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
const socket_io_1 = require("socket.io");
const auth_service_js_1 = require("../services/auth.service.js");
const user_service_js_1 = require("../services/user.service.js");
class SocketManager {
    io = null;
    // Map of userId -> Set of active socket IDs
    userSockets = new Map();
    // Map of roomId -> Map of socketId -> RoomPeer
    rooms = new Map();
    // Map of meetingId -> IMeetingRoom details (metadata)
    meetingRooms = new Map();
    initialize(httpServer, clientUrl) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 30000,
            pingInterval: 10000,
        });
        // JWT Authentication Middleware for WebSockets
        this.io.use((socket, next) => {
            try {
                const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication error: Missing token'));
                }
                const decoded = (0, auth_service_js_1.verifyToken)(token);
                socket.userId = decoded.userId;
                socket.userEmail = decoded.email;
                next();
            }
            catch (err) {
                return next(new Error('Authentication error: Invalid or expired token'));
            }
        });
        this.io.on('connection', async (socket) => {
            const userId = socket.userId;
            if (!userId)
                return;
            console.log(`[Socket] Client connected: user=${userId}, socket=${socket.id}`);
            // Track socket ID
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);
            // Join individual user room for private alerts
            socket.join(`user:${userId}`);
            // Update online status in database
            await user_service_js_1.UserService.setUserOnlineStatus(userId, true);
            // Broadcast user online event to all connected clients
            this.io?.emit('user-online', {
                userId,
                isOnline: true,
            });
            // ==========================================
            // REAL-TIME WebRTC SIGNALING SPECIFICATION
            // ==========================================
            // 1. Join Room: (roomId, userId, userName, avatar, isAudioOn, isVideoOn)
            socket.on('join-room', (data) => {
                const { roomId, userId: peerUserId, userName, avatar, isAudioOn = true, isVideoOn = true } = data;
                const cleanRoomId = roomId.replace(/-/g, '');
                socket.currentRoomId = cleanRoomId;
                socket.join(`room:${cleanRoomId}`);
                if (!this.rooms.has(cleanRoomId)) {
                    this.rooms.set(cleanRoomId, new Map());
                }
                const roomPeers = this.rooms.get(cleanRoomId);
                // Existing participants in the room
                const existingPeers = Array.from(roomPeers.values()).filter((p) => p.socketId !== socket.id);
                const currentPeer = {
                    socketId: socket.id,
                    userId: peerUserId || userId,
                    userName: userName || 'Participant',
                    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName || 'User')}`,
                    isAudioOn,
                    isVideoOn,
                    isScreenSharing: false,
                    isHandRaised: false,
                };
                roomPeers.set(socket.id, currentPeer);
                // Send back list of existing participants to caller so they can initiate WebRTC offers
                socket.emit('room-users', {
                    roomId: cleanRoomId,
                    users: existingPeers,
                });
                // Notify existing room participants that a new user connected
                socket.to(`room:${cleanRoomId}`).emit('user-connected', currentPeer);
                console.log(`[WebRTC] ${currentPeer.userName} (${socket.id}) joined room ${cleanRoomId}. Peers in room: ${roomPeers.size}`);
            });
            // 2. WebRTC SDP Offer forwarding: (targetSocketId, sdp, callerInfo)
            socket.on('offer', (data) => {
                const { targetSocketId, sdp, callerInfo } = data;
                this.io?.to(targetSocketId).emit('offer', {
                    callerSocketId: socket.id,
                    sdp,
                    callerInfo: callerInfo || {
                        socketId: socket.id,
                        userId,
                    },
                });
            });
            // 3. WebRTC SDP Answer forwarding: (targetSocketId, sdp)
            socket.on('answer', (data) => {
                const { targetSocketId, sdp } = data;
                this.io?.to(targetSocketId).emit('answer', {
                    senderSocketId: socket.id,
                    sdp,
                });
            });
            // 4. WebRTC ICE Candidate exchange: (targetSocketId, candidate)
            socket.on('ice-candidate', (data) => {
                const { targetSocketId, candidate } = data;
                this.io?.to(targetSocketId).emit('ice-candidate', {
                    senderSocketId: socket.id,
                    candidate,
                });
            });
            // 5. Media State Toggle: (roomId, userId, mediaType, isEnabled)
            socket.on('toggle-media', (data) => {
                const { roomId, userId: peerUserId, mediaType, isEnabled } = data;
                const cleanRoomId = roomId.replace(/-/g, '');
                const roomPeers = this.rooms.get(cleanRoomId);
                if (roomPeers && roomPeers.has(socket.id)) {
                    const peer = roomPeers.get(socket.id);
                    if (mediaType === 'audio')
                        peer.isAudioOn = isEnabled;
                    if (mediaType === 'video')
                        peer.isVideoOn = isEnabled;
                    if (mediaType === 'screen')
                        peer.isScreenSharing = isEnabled;
                }
                // Broadcast to all other participants in the room
                socket.to(`room:${cleanRoomId}`).emit('user-media-toggled', {
                    socketId: socket.id,
                    userId: peerUserId || userId,
                    mediaType,
                    isEnabled,
                });
            });
            // 6. Leave Room: (roomId)
            socket.on('leave-room', (data) => {
                const roomId = data?.roomId || socket.currentRoomId;
                if (roomId) {
                    this.handleRoomLeave(socket, roomId);
                }
            });
            // Backward compatible legacy events
            socket.on('meeting:join', (data) => {
                socket.emit('meeting:existing-participants', {
                    roomInfo: { meetingId: data.meetingId, title: data.title },
                    participants: [],
                });
            });
            // In-Meeting Chat Message
            socket.on('meeting:chat-message', (data) => {
                const { meetingId, text } = data;
                const cleanRoomId = meetingId.replace(/-/g, '');
                const roomPeers = this.rooms.get(cleanRoomId);
                const sender = roomPeers?.get(socket.id);
                const message = {
                    id: `mmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    senderId: userId,
                    senderName: sender?.userName || 'Participant',
                    senderAvatar: sender?.avatar || '',
                    text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                this.io?.to(`room:${cleanRoomId}`).emit('meeting:new-chat-message', message);
            });
            // Emoji Reactions
            socket.on('meeting:reaction', (data) => {
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
            socket.on('meeting:raise-hand', (data) => {
                const { meetingId, raised } = data;
                const cleanRoomId = meetingId.replace(/-/g, '');
                const roomPeers = this.rooms.get(cleanRoomId);
                const peer = roomPeers?.get(socket.id);
                if (peer)
                    peer.isHandRaised = raised;
                this.io?.to(`room:${cleanRoomId}`).emit('meeting:hand-status', {
                    socketId: socket.id,
                    userId,
                    name: peer?.userName || 'Participant',
                    raised,
                });
            });
            // Mute All (Host)
            socket.on('meeting:mute-all', (data) => {
                const cleanRoomId = data.meetingId.replace(/-/g, '');
                socket.to(`room:${cleanRoomId}`).emit('meeting:host-muted-all');
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
                        await user_service_js_1.UserService.setUserOnlineStatus(userId, false);
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
    handleRoomLeave(socket, roomId) {
        const cleanRoomId = roomId.replace(/-/g, '');
        const roomPeers = this.rooms.get(cleanRoomId);
        if (roomPeers && roomPeers.has(socket.id)) {
            const peer = roomPeers.get(socket.id);
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
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    // Check if a user is currently online
    isUserOnline(userId) {
        const sockets = this.userSockets.get(userId);
        return !!sockets && sockets.size > 0;
    }
}
exports.socketManager = new SocketManager();
