"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_js_1 = require("../models/User.js");
const db_js_1 = require("../config/db.js");
const auth_service_js_1 = require("./auth.service.js");
class UserService {
    // Search users by name or email
    static async searchUsers(query, currentUserId) {
        const q = query.trim().toLowerCase();
        if (!q)
            return [];
        if ((0, db_js_1.getIsMongoConnected)()) {
            const currentUser = await User_js_1.User.findById(currentUserId);
            if (!currentUser)
                throw new Error('Current user not found');
            const users = await User_js_1.User.find({
                _id: { $ne: currentUser._id },
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                ],
            }).limit(20);
            const currentFriendIds = new Set(currentUser.friends.map((f) => f.toString()));
            return users.map((u) => {
                let friendStatus = 'none';
                const targetIdStr = u._id.toString();
                if (currentFriendIds.has(targetIdStr)) {
                    friendStatus = 'friends';
                }
                else {
                    // Check pending requests
                    const sentReq = currentUser.friendRequests.find((r) => r.user.toString() === targetIdStr && r.direction === 'sent' && r.status === 'pending');
                    const receivedReq = currentUser.friendRequests.find((r) => r.user.toString() === targetIdStr && r.direction === 'received' && r.status === 'pending');
                    if (sentReq)
                        friendStatus = 'pending_sent';
                    else if (receivedReq)
                        friendStatus = 'pending_received';
                }
                return {
                    _id: targetIdStr,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar,
                    bio: u.bio,
                    personalMeetingId: u.personalMeetingId,
                    isOnline: u.isOnline,
                    lastSeen: u.lastSeen,
                    friendStatus,
                };
            });
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const currentUser = auth_service_js_1.inMemoryUsers.get(currentUserId);
            if (!currentUser)
                throw new Error('Current user not found');
            const results = [];
            const currentFriendIds = new Set(currentUser.friends);
            for (const u of auth_service_js_1.inMemoryUsers.values()) {
                if (u._id === currentUserId)
                    continue;
                const matchesName = u.name.toLowerCase().includes(q);
                const matchesEmail = u.email.toLowerCase().includes(q);
                if (matchesName || matchesEmail) {
                    let friendStatus = 'none';
                    if (currentFriendIds.has(u._id)) {
                        friendStatus = 'friends';
                    }
                    else {
                        const sentReq = currentUser.friendRequests.find((r) => r.userId === u._id && r.direction === 'sent' && r.status === 'pending');
                        const receivedReq = currentUser.friendRequests.find((r) => r.userId === u._id && r.direction === 'received' && r.status === 'pending');
                        if (sentReq)
                            friendStatus = 'pending_sent';
                        else if (receivedReq)
                            friendStatus = 'pending_received';
                    }
                    results.push({
                        _id: u._id,
                        name: u.name,
                        email: u.email,
                        avatar: u.avatar,
                        bio: u.bio,
                        personalMeetingId: u.personalMeetingId,
                        isOnline: u.isOnline,
                        lastSeen: u.lastSeen,
                        friendStatus,
                    });
                }
            }
            return results;
        }
    }
    // Send a friend request
    static async sendFriendRequest(currentUserId, targetUserId) {
        if (currentUserId === targetUserId) {
            throw new Error('You cannot send a friend request to yourself');
        }
        if ((0, db_js_1.getIsMongoConnected)()) {
            const [currentUser, targetUser] = await Promise.all([
                User_js_1.User.findById(currentUserId),
                User_js_1.User.findById(targetUserId),
            ]);
            if (!currentUser || !targetUser)
                throw new Error('User not found');
            // Check if already friends
            if (currentUser.friends.some((f) => f.toString() === targetUserId)) {
                throw new Error('You are already friends with this user');
            }
            // Check if request already sent or pending
            const alreadySent = currentUser.friendRequests.some((r) => r.user.toString() === targetUserId && r.status === 'pending');
            if (alreadySent) {
                throw new Error('Friend request already sent or pending');
            }
            const reqId = new mongoose_1.default.Types.ObjectId();
            currentUser.friendRequests.push({
                _id: reqId,
                user: targetUser._id,
                direction: 'sent',
                status: 'pending',
                createdAt: new Date(),
            });
            targetUser.friendRequests.push({
                _id: reqId,
                user: currentUser._id,
                direction: 'received',
                status: 'pending',
                createdAt: new Date(),
            });
            await Promise.all([currentUser.save(), targetUser.save()]);
            return {
                success: true,
                message: 'Friend request sent successfully',
                targetUserId,
            };
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const currentUser = auth_service_js_1.inMemoryUsers.get(currentUserId);
            const targetUser = auth_service_js_1.inMemoryUsers.get(targetUserId);
            if (!currentUser || !targetUser)
                throw new Error('User not found');
            if (currentUser.friends.includes(targetUserId)) {
                throw new Error('You are already friends with this user');
            }
            const alreadySent = currentUser.friendRequests.some((r) => r.userId === targetUserId && r.status === 'pending');
            if (alreadySent) {
                throw new Error('Friend request already pending');
            }
            const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            currentUser.friendRequests.push({
                _id: reqId,
                userId: targetUserId,
                direction: 'sent',
                status: 'pending',
                createdAt: new Date(),
            });
            targetUser.friendRequests.push({
                _id: reqId,
                userId: currentUserId,
                direction: 'received',
                status: 'pending',
                createdAt: new Date(),
            });
            return {
                success: true,
                message: 'Friend request sent successfully',
                targetUserId,
            };
        }
    }
    // Accept a friend request
    static async acceptFriendRequest(currentUserId, senderUserId) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            const [currentUser, senderUser] = await Promise.all([
                User_js_1.User.findById(currentUserId),
                User_js_1.User.findById(senderUserId),
            ]);
            if (!currentUser || !senderUser)
                throw new Error('User not found');
            // Update current user's request list
            const req = currentUser.friendRequests.find((r) => r.user.toString() === senderUserId && r.direction === 'received' && r.status === 'pending');
            if (!req) {
                throw new Error('Friend request not found or already processed');
            }
            req.status = 'accepted';
            currentUser.friends.push(senderUser._id);
            // Update sender's request list
            const senderReq = senderUser.friendRequests.find((r) => r.user.toString() === currentUserId && r.direction === 'sent' && r.status === 'pending');
            if (senderReq) {
                senderReq.status = 'accepted';
            }
            senderUser.friends.push(currentUser._id);
            await Promise.all([currentUser.save(), senderUser.save()]);
            return {
                success: true,
                message: 'Friend request accepted',
                friend: senderUser.toSummary(),
            };
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const currentUser = auth_service_js_1.inMemoryUsers.get(currentUserId);
            const senderUser = auth_service_js_1.inMemoryUsers.get(senderUserId);
            if (!currentUser || !senderUser)
                throw new Error('User not found');
            const req = currentUser.friendRequests.find((r) => r.userId === senderUserId && r.direction === 'received' && r.status === 'pending');
            if (!req) {
                throw new Error('Friend request not found or already processed');
            }
            req.status = 'accepted';
            if (!currentUser.friends.includes(senderUserId)) {
                currentUser.friends.push(senderUserId);
            }
            const senderReq = senderUser.friendRequests.find((r) => r.userId === currentUserId && r.direction === 'sent' && r.status === 'pending');
            if (senderReq) {
                senderReq.status = 'accepted';
            }
            if (!senderUser.friends.includes(currentUserId)) {
                senderUser.friends.push(currentUserId);
            }
            return {
                success: true,
                message: 'Friend request accepted',
                friend: {
                    _id: senderUser._id,
                    name: senderUser.name,
                    email: senderUser.email,
                    avatar: senderUser.avatar,
                    bio: senderUser.bio,
                    personalMeetingId: senderUser.personalMeetingId,
                    isOnline: senderUser.isOnline,
                    lastSeen: senderUser.lastSeen,
                },
            };
        }
    }
    // Reject a friend request
    static async rejectFriendRequest(currentUserId, senderUserId) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            const [currentUser, senderUser] = await Promise.all([
                User_js_1.User.findById(currentUserId),
                User_js_1.User.findById(senderUserId),
            ]);
            if (!currentUser || !senderUser)
                throw new Error('User not found');
            const req = currentUser.friendRequests.find((r) => r.user.toString() === senderUserId && r.direction === 'received' && r.status === 'pending');
            if (!req) {
                throw new Error('Friend request not found');
            }
            req.status = 'rejected';
            const senderReq = senderUser.friendRequests.find((r) => r.user.toString() === currentUserId && r.direction === 'sent' && r.status === 'pending');
            if (senderReq) {
                senderReq.status = 'rejected';
            }
            await Promise.all([currentUser.save(), senderUser.save()]);
            return { success: true, message: 'Friend request declined' };
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const currentUser = auth_service_js_1.inMemoryUsers.get(currentUserId);
            const senderUser = auth_service_js_1.inMemoryUsers.get(senderUserId);
            if (!currentUser || !senderUser)
                throw new Error('User not found');
            const req = currentUser.friendRequests.find((r) => r.userId === senderUserId && r.direction === 'received' && r.status === 'pending');
            if (!req) {
                throw new Error('Friend request not found');
            }
            req.status = 'rejected';
            const senderReq = senderUser.friendRequests.find((r) => r.userId === currentUserId && r.direction === 'sent' && r.status === 'pending');
            if (senderReq) {
                senderReq.status = 'rejected';
            }
            return { success: true, message: 'Friend request declined' };
        }
    }
    // Get user's friends list
    static async getFriends(userId) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            const user = await User_js_1.User.findById(userId).populate('friends');
            if (!user)
                throw new Error('User not found');
            return (user.friends || []).map((f) => ({
                _id: f._id.toString(),
                name: f.name,
                email: f.email,
                avatar: f.avatar,
                bio: f.bio,
                personalMeetingId: f.personalMeetingId,
                isOnline: f.isOnline,
                lastSeen: f.lastSeen,
            }));
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const user = auth_service_js_1.inMemoryUsers.get(userId);
            if (!user)
                throw new Error('User not found');
            const friendSummaries = [];
            for (const friendId of user.friends) {
                const friend = auth_service_js_1.inMemoryUsers.get(friendId);
                if (friend) {
                    friendSummaries.push({
                        _id: friend._id,
                        name: friend.name,
                        email: friend.email,
                        avatar: friend.avatar,
                        bio: friend.bio,
                        personalMeetingId: friend.personalMeetingId,
                        isOnline: friend.isOnline,
                        lastSeen: friend.lastSeen,
                    });
                }
            }
            return friendSummaries;
        }
    }
    // Get friend requests (incoming & outgoing)
    static async getFriendRequests(userId) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            const user = await User_js_1.User.findById(userId).populate('friendRequests.user');
            if (!user)
                throw new Error('User not found');
            const incoming = user.friendRequests
                .filter((r) => r.direction === 'received' && r.status === 'pending')
                .map((r) => ({
                requestId: r._id,
                user: r.user.toSummary ? r.user.toSummary() : r.user,
                createdAt: r.createdAt,
            }));
            const outgoing = user.friendRequests
                .filter((r) => r.direction === 'sent' && r.status === 'pending')
                .map((r) => ({
                requestId: r._id,
                user: r.user.toSummary ? r.user.toSummary() : r.user,
                createdAt: r.createdAt,
            }));
            return { incoming, outgoing };
        }
        else {
            (0, auth_service_js_1.seedInMemoryStore)();
            const user = auth_service_js_1.inMemoryUsers.get(userId);
            if (!user)
                throw new Error('User not found');
            const incoming = [];
            const outgoing = [];
            for (const r of user.friendRequests) {
                if (r.status !== 'pending')
                    continue;
                const otherUser = auth_service_js_1.inMemoryUsers.get(r.userId);
                if (!otherUser)
                    continue;
                const summary = {
                    _id: otherUser._id,
                    name: otherUser.name,
                    email: otherUser.email,
                    avatar: otherUser.avatar,
                    bio: otherUser.bio,
                    personalMeetingId: otherUser.personalMeetingId,
                    isOnline: otherUser.isOnline,
                    lastSeen: otherUser.lastSeen,
                };
                if (r.direction === 'received') {
                    incoming.push({
                        requestId: r._id,
                        user: summary,
                        createdAt: r.createdAt,
                    });
                }
                else {
                    outgoing.push({
                        requestId: r._id,
                        user: summary,
                        createdAt: r.createdAt,
                    });
                }
            }
            return { incoming, outgoing };
        }
    }
    // Set user online status
    static async setUserOnlineStatus(userId, isOnline) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            await User_js_1.User.findByIdAndUpdate(userId, {
                isOnline,
                lastSeen: new Date(),
            });
        }
        else {
            const user = auth_service_js_1.inMemoryUsers.get(userId);
            if (user) {
                user.isOnline = isOnline;
                user.lastSeen = new Date();
            }
        }
    }
}
exports.UserService = UserService;
