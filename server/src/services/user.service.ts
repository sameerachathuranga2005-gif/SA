import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { getIsMongoConnected } from '../config/db.js';
import { ISearchUserResult, FriendStatus, IUserSummary } from '../types/index.js';
import { inMemoryUsers, seedInMemoryStore } from './auth.service.js';

export class UserService {
  // Search users by name or email
  static async searchUsers(query: string, currentUserId: string): Promise<ISearchUserResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    if (getIsMongoConnected()) {
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) throw new Error('Current user not found');

      const users = await User.find({
        _id: { $ne: currentUser._id },
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }).limit(20);

      const currentFriendIds = new Set(currentUser.friends.map((f: any) => f.toString()));

      return users.map((u) => {
        let friendStatus: FriendStatus = 'none';
        const targetIdStr = u._id.toString();

        if (currentFriendIds.has(targetIdStr)) {
          friendStatus = 'friends';
        } else {
          // Check pending requests
          const sentReq = currentUser.friendRequests.find(
            (r: any) => r.user.toString() === targetIdStr && r.direction === 'sent' && r.status === 'pending'
          );
          const receivedReq = currentUser.friendRequests.find(
            (r: any) => r.user.toString() === targetIdStr && r.direction === 'received' && r.status === 'pending'
          );

          if (sentReq) friendStatus = 'pending_sent';
          else if (receivedReq) friendStatus = 'pending_received';
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
    } else {
      seedInMemoryStore();
      const currentUser = inMemoryUsers.get(currentUserId);
      if (!currentUser) throw new Error('Current user not found');

      const results: ISearchUserResult[] = [];
      const currentFriendIds = new Set(currentUser.friends);

      for (const u of inMemoryUsers.values()) {
        if (u._id === currentUserId) continue;

        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);

        if (matchesName || matchesEmail) {
          let friendStatus: FriendStatus = 'none';

          if (currentFriendIds.has(u._id)) {
            friendStatus = 'friends';
          } else {
            const sentReq = currentUser.friendRequests.find(
              (r) => r.userId === u._id && r.direction === 'sent' && r.status === 'pending'
            );
            const receivedReq = currentUser.friendRequests.find(
              (r) => r.userId === u._id && r.direction === 'received' && r.status === 'pending'
            );

            if (sentReq) friendStatus = 'pending_sent';
            else if (receivedReq) friendStatus = 'pending_received';
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
  static async sendFriendRequest(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    if (getIsMongoConnected()) {
      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId),
      ]);

      if (!currentUser || !targetUser) throw new Error('User not found');

      // Check if already friends
      if (currentUser.friends.some((f: any) => f.toString() === targetUserId)) {
        throw new Error('You are already friends with this user');
      }

      // Check if request already sent or pending
      const alreadySent = currentUser.friendRequests.some(
        (r: any) => r.user.toString() === targetUserId && r.status === 'pending'
      );
      if (alreadySent) {
        throw new Error('Friend request already sent or pending');
      }

      const reqId = new mongoose.Types.ObjectId();

      currentUser.friendRequests.push({
        _id: reqId,
        user: targetUser._id,
        direction: 'sent',
        status: 'pending',
        createdAt: new Date(),
      } as any);

      targetUser.friendRequests.push({
        _id: reqId,
        user: currentUser._id,
        direction: 'received',
        status: 'pending',
        createdAt: new Date(),
      } as any);

      await Promise.all([currentUser.save(), targetUser.save()]);

      return {
        success: true,
        message: 'Friend request sent successfully',
        targetUserId,
      };
    } else {
      seedInMemoryStore();
      const currentUser = inMemoryUsers.get(currentUserId);
      const targetUser = inMemoryUsers.get(targetUserId);

      if (!currentUser || !targetUser) throw new Error('User not found');

      if (currentUser.friends.includes(targetUserId)) {
        throw new Error('You are already friends with this user');
      }

      const alreadySent = currentUser.friendRequests.some(
        (r) => r.userId === targetUserId && r.status === 'pending'
      );
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
  static async acceptFriendRequest(currentUserId: string, senderUserId: string) {
    if (getIsMongoConnected()) {
      const [currentUser, senderUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(senderUserId),
      ]);

      if (!currentUser || !senderUser) throw new Error('User not found');

      // Update current user's request list
      const req = currentUser.friendRequests.find(
        (r: any) => r.user.toString() === senderUserId && r.direction === 'received' && r.status === 'pending'
      );
      if (!req) {
        throw new Error('Friend request not found or already processed');
      }

      req.status = 'accepted';
      currentUser.friends.push(senderUser._id as any);

      // Update sender's request list
      const senderReq = senderUser.friendRequests.find(
        (r: any) => r.user.toString() === currentUserId && r.direction === 'sent' && r.status === 'pending'
      );
      if (senderReq) {
        senderReq.status = 'accepted';
      }
      senderUser.friends.push(currentUser._id as any);

      await Promise.all([currentUser.save(), senderUser.save()]);

      return {
        success: true,
        message: 'Friend request accepted',
        friend: senderUser.toSummary(),
      };
    } else {
      seedInMemoryStore();
      const currentUser = inMemoryUsers.get(currentUserId);
      const senderUser = inMemoryUsers.get(senderUserId);

      if (!currentUser || !senderUser) throw new Error('User not found');

      const req = currentUser.friendRequests.find(
        (r) => r.userId === senderUserId && r.direction === 'received' && r.status === 'pending'
      );
      if (!req) {
        throw new Error('Friend request not found or already processed');
      }

      req.status = 'accepted';
      if (!currentUser.friends.includes(senderUserId)) {
        currentUser.friends.push(senderUserId);
      }

      const senderReq = senderUser.friendRequests.find(
        (r) => r.userId === currentUserId && r.direction === 'sent' && r.status === 'pending'
      );
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
  static async rejectFriendRequest(currentUserId: string, senderUserId: string) {
    if (getIsMongoConnected()) {
      const [currentUser, senderUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(senderUserId),
      ]);

      if (!currentUser || !senderUser) throw new Error('User not found');

      const req = currentUser.friendRequests.find(
        (r: any) => r.user.toString() === senderUserId && r.direction === 'received' && r.status === 'pending'
      );
      if (!req) {
        throw new Error('Friend request not found');
      }
      req.status = 'rejected';

      const senderReq = senderUser.friendRequests.find(
        (r: any) => r.user.toString() === currentUserId && r.direction === 'sent' && r.status === 'pending'
      );
      if (senderReq) {
        senderReq.status = 'rejected';
      }

      await Promise.all([currentUser.save(), senderUser.save()]);

      return { success: true, message: 'Friend request declined' };
    } else {
      seedInMemoryStore();
      const currentUser = inMemoryUsers.get(currentUserId);
      const senderUser = inMemoryUsers.get(senderUserId);

      if (!currentUser || !senderUser) throw new Error('User not found');

      const req = currentUser.friendRequests.find(
        (r) => r.userId === senderUserId && r.direction === 'received' && r.status === 'pending'
      );
      if (!req) {
        throw new Error('Friend request not found');
      }
      req.status = 'rejected';

      const senderReq = senderUser.friendRequests.find(
        (r) => r.userId === currentUserId && r.direction === 'sent' && r.status === 'pending'
      );
      if (senderReq) {
        senderReq.status = 'rejected';
      }

      return { success: true, message: 'Friend request declined' };
    }
  }

  // Get user's friends list
  static async getFriends(userId: string): Promise<IUserSummary[]> {
    if (getIsMongoConnected()) {
      const user = await User.findById(userId).populate<{ friends: any[] }>('friends');
      if (!user) throw new Error('User not found');

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
    } else {
      seedInMemoryStore();
      const user = inMemoryUsers.get(userId);
      if (!user) throw new Error('User not found');

      const friendSummaries: IUserSummary[] = [];
      for (const friendId of user.friends) {
        const friend = inMemoryUsers.get(friendId);
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
  static async getFriendRequests(userId: string) {
    if (getIsMongoConnected()) {
      const user = await User.findById(userId).populate<{
        'friendRequests.user': any;
      }>('friendRequests.user');

      if (!user) throw new Error('User not found');

      const incoming = user.friendRequests
        .filter((r) => r.direction === 'received' && r.status === 'pending')
        .map((r) => ({
          requestId: (r as any)._id,
          user: (r.user as any).toSummary ? (r.user as any).toSummary() : r.user,
          createdAt: r.createdAt,
        }));

      const outgoing = user.friendRequests
        .filter((r) => r.direction === 'sent' && r.status === 'pending')
        .map((r) => ({
          requestId: (r as any)._id,
          user: (r.user as any).toSummary ? (r.user as any).toSummary() : r.user,
          createdAt: r.createdAt,
        }));

      return { incoming, outgoing };
    } else {
      seedInMemoryStore();
      const user = inMemoryUsers.get(userId);
      if (!user) throw new Error('User not found');

      const incoming: any[] = [];
      const outgoing: any[] = [];

      for (const r of user.friendRequests) {
        if (r.status !== 'pending') continue;
        const otherUser = inMemoryUsers.get(r.userId);
        if (!otherUser) continue;

        const summary: IUserSummary = {
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
        } else {
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
  static async setUserOnlineStatus(userId: string, isOnline: boolean) {
    if (getIsMongoConnected()) {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date(),
      });
    } else {
      const user = inMemoryUsers.get(userId);
      if (user) {
        user.isOnline = isOnline;
        user.lastSeen = new Date();
      }
    }
  }
}

