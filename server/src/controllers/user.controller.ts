import { Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { socketManager } from '../sockets/socket.manager.js';

export const searchQuerySchema = z.object({
  q: z.string().default(''),
});

export const friendRequestSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

export const respondFriendSchema = z.object({
  senderUserId: z.string().min(1, 'Sender user ID is required'),
});

export class UserController {
  static async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const currentUserId = req.user!._id;

      const users = await UserService.searchUsers(query, currentUserId);
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error searching users',
      });
    }
  }

  static async sendFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!._id;
      const { targetUserId } = req.body;

      const result = await UserService.sendFriendRequest(currentUserId, targetUserId);

      // Emit socket notification to recipient
      socketManager.emitToUser(targetUserId, 'friend-request-received', {
        from: req.user,
        createdAt: new Date(),
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send friend request',
      });
    }
  }

  static async acceptFriend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!._id;
      const { senderUserId } = req.body;

      const result = await UserService.acceptFriendRequest(currentUserId, senderUserId);

      // Notify the sender that their request was accepted
      socketManager.emitToUser(senderUserId, 'friend-request-accepted', {
        by: req.user,
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept friend request',
      });
    }
  }

  static async rejectFriend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!._id;
      const { senderUserId } = req.body;

      const result = await UserService.rejectFriendRequest(currentUserId, senderUserId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to decline friend request',
      });
    }
  }

  static async getFriends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!._id;
      const friends = await UserService.getFriends(currentUserId);

      res.status(200).json({
        success: true,
        data: friends,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch friends',
      });
    }
  }

  static async getFriendRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!._id;
      const requests = await UserService.getFriendRequests(currentUserId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch friend requests',
      });
    }
  }
}

