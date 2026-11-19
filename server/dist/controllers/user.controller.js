"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = exports.respondFriendSchema = exports.friendRequestSchema = exports.searchQuerySchema = void 0;
const zod_1 = require("zod");
const user_service_js_1 = require("../services/user.service.js");
const socket_manager_js_1 = require("../sockets/socket.manager.js");
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().default(''),
});
exports.friendRequestSchema = zod_1.z.object({
    targetUserId: zod_1.z.string().min(1, 'Target user ID is required'),
});
exports.respondFriendSchema = zod_1.z.object({
    senderUserId: zod_1.z.string().min(1, 'Sender user ID is required'),
});
class UserController {
    static async search(req, res) {
        try {
            const query = req.query.q || '';
            const currentUserId = req.user._id;
            const users = await user_service_js_1.UserService.searchUsers(query, currentUserId);
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error searching users',
            });
        }
    }
    static async sendFriendRequest(req, res) {
        try {
            const currentUserId = req.user._id;
            const { targetUserId } = req.body;
            const result = await user_service_js_1.UserService.sendFriendRequest(currentUserId, targetUserId);
            // Emit socket notification to recipient
            socket_manager_js_1.socketManager.emitToUser(targetUserId, 'friend-request-received', {
                from: req.user,
                createdAt: new Date(),
            });
            res.status(200).json(result);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to send friend request',
            });
        }
    }
    static async acceptFriend(req, res) {
        try {
            const currentUserId = req.user._id;
            const { senderUserId } = req.body;
            const result = await user_service_js_1.UserService.acceptFriendRequest(currentUserId, senderUserId);
            // Notify the sender that their request was accepted
            socket_manager_js_1.socketManager.emitToUser(senderUserId, 'friend-request-accepted', {
                by: req.user,
            });
            res.status(200).json(result);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to accept friend request',
            });
        }
    }
    static async rejectFriend(req, res) {
        try {
            const currentUserId = req.user._id;
            const { senderUserId } = req.body;
            const result = await user_service_js_1.UserService.rejectFriendRequest(currentUserId, senderUserId);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to decline friend request',
            });
        }
    }
    static async getFriends(req, res) {
        try {
            const currentUserId = req.user._id;
            const friends = await user_service_js_1.UserService.getFriends(currentUserId);
            res.status(200).json({
                success: true,
                data: friends,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch friends',
            });
        }
    }
    static async getFriendRequests(req, res) {
        try {
            const currentUserId = req.user._id;
            const requests = await user_service_js_1.UserService.getFriendRequests(currentUserId);
            res.status(200).json({
                success: true,
                data: requests,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch friend requests',
            });
        }
    }
}
exports.UserController = UserController;
