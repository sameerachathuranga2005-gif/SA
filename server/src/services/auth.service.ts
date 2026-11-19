import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUserDocument } from '../models/User.js';
import { getIsMongoConnected } from '../config/db.js';
import { JWTPayload, IAuthResponse, IUserSummary } from '../types/index.js';
import { DEMO_FRIENDS, DEMO_PENDING_REQUESTERS, DEMO_EXPLORE_USERS } from './mockData.js';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'superapp_production_secret_key_change_in_prod_2025_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate 9-digit Personal Meeting ID in format: XXX-XXX-XXX
export function generateMeetingId(): string {
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// In-Memory Fallback State (Active when MongoDB is not connected)
export interface InMemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  personalMeetingId: string;
  friends: string[]; // User IDs
  friendRequests: {
    _id: string;
    userId: string;
    direction: 'sent' | 'received';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
  }[];
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export const inMemoryUsers: Map<string, InMemoryUser> = new Map();

// Helper to seed in-memory users
let inMemorySeeded = false;
export function seedInMemoryStore() {
  if (inMemorySeeded) return;

  // Add demo friends
  for (const f of [...DEMO_FRIENDS, ...DEMO_PENDING_REQUESTERS, ...DEMO_EXPLORE_USERS]) {
    inMemoryUsers.set(f.id, {
      _id: f.id,
      name: f.name,
      email: f.email,
      passwordHash: bcrypt.hashSync('demo12345', 10),
      avatar: f.avatar,
      bio: f.bio,
      personalMeetingId: f.personalMeetingId,
      friends: [],
      friendRequests: [],
      isOnline: f.isOnline,
      lastSeen: f.lastSeen,
      createdAt: new Date(),
    });
  }

  // Create Alex Johnson (Recruiter Demo Lead)
  const demoId = 'demo-recruiter-id';
  const friendsIds = DEMO_FRIENDS.map((f) => f.id);

  // Cross link friends
  for (const friendId of friendsIds) {
    const friend = inMemoryUsers.get(friendId);
    if (friend) {
      friend.friends.push(demoId);
    }
  }

  // Incoming friend request from Sophia Taylor
  const incomingReqUser = DEMO_PENDING_REQUESTERS[0];
  // Outgoing friend request to James Wilson
  const outgoingReqUser = DEMO_PENDING_REQUESTERS[1];

  inMemoryUsers.set(demoId, {
    _id: demoId,
    name: 'Alex Johnson (Demo Lead)',
    email: 'demo@superapp.dev',
    passwordHash: bcrypt.hashSync('password123', 10),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    bio: 'Lead Engineer & Architect | Testing the SuperApp Unified Communication Suite 🚀',
    personalMeetingId: '982-415-309',
    friends: friendsIds,
    friendRequests: [
      {
        _id: 'req-in-1',
        userId: incomingReqUser.id,
        direction: 'received',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        _id: 'req-out-1',
        userId: outgoingReqUser.id,
        direction: 'sent',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 50),
      },
    ],
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date(),
  });

  // Also set corresponding requests on the other users
  const incomingUser = inMemoryUsers.get(incomingReqUser.id);
  if (incomingUser) {
    incomingUser.friendRequests.push({
      _id: 'req-in-1',
      userId: demoId,
      direction: 'sent',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    });
  }

  const outgoingUser = inMemoryUsers.get(outgoingReqUser.id);
  if (outgoingUser) {
    outgoingUser.friendRequests.push({
      _id: 'req-out-1',
      userId: demoId,
      direction: 'received',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 50),
    });
  }

  inMemorySeeded = true;
}

// Seed on module load
seedInMemoryStore();

export class AuthService {
  // Register a new user
  static async register(name: string, email: string, password: string):Promise<IAuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    if (getIsMongoConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const pmi = generateMeetingId();
      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        personalMeetingId: pmi,
        bio: 'SuperApp explorer | Ready for chats & meetings',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
      });

      const token = generateToken({ userId: user._id.toString(), email: user.email });
      return {
        token,
        user: {
          ...user.toSummary(),
          friendsCount: 0,
          pendingRequestsCount: 0,
        } as any,
      };
    } else {
      // In-Memory mode
      for (const u of inMemoryUsers.values()) {
        if (u.email.toLowerCase() === normalizedEmail) {
          throw new Error('User with this email already exists');
        }
      }

      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const pmi = generateMeetingId();

      const newUser: InMemoryUser = {
        _id: newId,
        name,
        email: normalizedEmail,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        bio: 'SuperApp explorer | Ready for chats & meetings',
        personalMeetingId: pmi,
        friends: [],
        friendRequests: [],
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };

      inMemoryUsers.set(newId, newUser);
      const token = generateToken({ userId: newId, email: normalizedEmail });

      return {
        token,
        user: {
          _id: newId,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          bio: newUser.bio,
          personalMeetingId: newUser.personalMeetingId,
          isOnline: newUser.isOnline,
          lastSeen: newUser.lastSeen,
          friendsCount: 0,
          pendingRequestsCount: 0,
        },
      };
    }
  }

  // Login existing user
  static async login(email: string, password: string): Promise<IAuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    if (getIsMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = generateToken({ userId: user._id.toString(), email: user.email });
      return {
        token,
        user: user.toSummary() as any,
      };
    } else {
      // In-Memory mode
      seedInMemoryStore();
      let matchedUser: InMemoryUser | undefined;
      for (const u of inMemoryUsers.values()) {
        if (u.email.toLowerCase() === normalizedEmail) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = generateToken({ userId: matchedUser._id, email: matchedUser.email });
      const pendingCount = matchedUser.friendRequests.filter(
        (r) => r.direction === 'received' && r.status === 'pending'
      ).length;

      return {
        token,
        user: {
          _id: matchedUser._id,
          name: matchedUser.name,
          email: matchedUser.email,
          avatar: matchedUser.avatar,
          bio: matchedUser.bio,
          personalMeetingId: matchedUser.personalMeetingId,
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: matchedUser.friends.length,
          pendingRequestsCount: pendingCount,
        },
      };
    }
  }

  // 1-Click Recruiter Demo Login
  static async demoLogin(): Promise<IAuthResponse> {
    const demoEmail = 'demo@superapp.dev';

    if (getIsMongoConnected()) {
      let demoUser = await User.findOne({ email: demoEmail });

      if (!demoUser) {
        // Create demo friends first in MongoDB
        const friendIds: mongoose.Types.ObjectId[] = [];
        for (const df of DEMO_FRIENDS) {
          let friendDoc = await User.findOne({ email: df.email });
          if (!friendDoc) {
            friendDoc = await User.create({
              name: df.name,
              email: df.email,
              password: 'password123',
              avatar: df.avatar,
              bio: df.bio,
              personalMeetingId: df.personalMeetingId,
              isOnline: df.isOnline,
              lastSeen: df.lastSeen,
            });
          }
          friendIds.push(friendDoc._id as mongoose.Types.ObjectId);
        }

        // Create Demo User
        demoUser = await User.create({
          name: 'Alex Johnson (Demo Lead)',
          email: demoEmail,
          password: 'password123',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
          bio: 'Lead Engineer & Architect | Testing the SuperApp Unified Communication Suite 🚀',
          personalMeetingId: '982-415-309',
          friends: friendIds,
          isOnline: true,
        });

        // Add demoUser to friends' lists
        await User.updateMany({ _id: { $in: friendIds } }, { $addToSet: { friends: demoUser._id } });

        // Add incoming requester
        const requesterDoc = await User.create({
          name: DEMO_PENDING_REQUESTERS[0].name,
          email: DEMO_PENDING_REQUESTERS[0].email,
          password: 'password123',
          avatar: DEMO_PENDING_REQUESTERS[0].avatar,
          bio: DEMO_PENDING_REQUESTERS[0].bio,
          personalMeetingId: DEMO_PENDING_REQUESTERS[0].personalMeetingId,
        });

        demoUser.friendRequests.push({
          user: requesterDoc._id,
          direction: 'received',
          status: 'pending',
          createdAt: new Date(),
        } as any);
        await demoUser.save();
      }

      const token = generateToken({ userId: demoUser._id.toString(), email: demoUser.email });
      return {
        token,
        user: demoUser.toSummary() as any,
      };
    } else {
      // In-Memory Demo Login
      seedInMemoryStore();
      const demoUser = inMemoryUsers.get('demo-recruiter-id')!;
      const token = generateToken({ userId: demoUser._id, email: demoUser.email });
      const pendingCount = demoUser.friendRequests.filter(
        (r) => r.direction === 'received' && r.status === 'pending'
      ).length;

      return {
        token,
        user: {
          _id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          avatar: demoUser.avatar,
          bio: demoUser.bio,
          personalMeetingId: demoUser.personalMeetingId,
          isOnline: true,
          lastSeen: new Date(),
          friendsCount: demoUser.friends.length,
          pendingRequestsCount: pendingCount,
        },
      };
    }
  }

  // Get current user details
  static async getCurrentUser(userId: string): Promise<IUserSummary & { friendsCount: number; pendingRequestsCount: number }> {
    if (getIsMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toSummary() as any;
    } else {
      const user = inMemoryUsers.get(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const pendingCount = user.friendRequests.filter(
        (r) => r.direction === 'received' && r.status === 'pending'
      ).length;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        personalMeetingId: user.personalMeetingId,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        friendsCount: user.friends.length,
        pendingRequestsCount: pendingCount,
      };
    }
  }
}

