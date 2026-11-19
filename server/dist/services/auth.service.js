"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.inMemoryUsers = void 0;
exports.generateMeetingId = generateMeetingId;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.seedInMemoryStore = seedInMemoryStore;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = require("../models/User.js");
const db_js_1 = require("../config/db.js");
const mockData_js_1 = require("./mockData.js");
const JWT_SECRET = process.env.JWT_SECRET || 'superapp_production_secret_key_change_in_prod_2025_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Generate 9-digit Personal Meeting ID in format: XXX-XXX-XXX
function generateMeetingId() {
    const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}
// Generate JWT token
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
// Verify JWT token
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
exports.inMemoryUsers = new Map();
// Helper to seed in-memory users
let inMemorySeeded = false;
function seedInMemoryStore() {
    if (inMemorySeeded)
        return;
    // Add demo friends
    for (const f of [...mockData_js_1.DEMO_FRIENDS, ...mockData_js_1.DEMO_PENDING_REQUESTERS, ...mockData_js_1.DEMO_EXPLORE_USERS]) {
        exports.inMemoryUsers.set(f.id, {
            _id: f.id,
            name: f.name,
            email: f.email,
            passwordHash: bcryptjs_1.default.hashSync('demo12345', 10),
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
    const friendsIds = mockData_js_1.DEMO_FRIENDS.map((f) => f.id);
    // Cross link friends
    for (const friendId of friendsIds) {
        const friend = exports.inMemoryUsers.get(friendId);
        if (friend) {
            friend.friends.push(demoId);
        }
    }
    // Incoming friend request from Sophia Taylor
    const incomingReqUser = mockData_js_1.DEMO_PENDING_REQUESTERS[0];
    // Outgoing friend request to James Wilson
    const outgoingReqUser = mockData_js_1.DEMO_PENDING_REQUESTERS[1];
    exports.inMemoryUsers.set(demoId, {
        _id: demoId,
        name: 'Alex Johnson (Demo Lead)',
        email: 'demo@superapp.dev',
        passwordHash: bcryptjs_1.default.hashSync('password123', 10),
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
    const incomingUser = exports.inMemoryUsers.get(incomingReqUser.id);
    if (incomingUser) {
        incomingUser.friendRequests.push({
            _id: 'req-in-1',
            userId: demoId,
            direction: 'sent',
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 15),
        });
    }
    const outgoingUser = exports.inMemoryUsers.get(outgoingReqUser.id);
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
class AuthService {
    // Register a new user
    static async register(name, email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        if ((0, db_js_1.getIsMongoConnected)()) {
            const existingUser = await User_js_1.User.findOne({ email: normalizedEmail });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            const pmi = generateMeetingId();
            const user = await User_js_1.User.create({
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
                },
            };
        }
        else {
            // In-Memory mode
            for (const u of exports.inMemoryUsers.values()) {
                if (u.email.toLowerCase() === normalizedEmail) {
                    throw new Error('User with this email already exists');
                }
            }
            const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const pmi = generateMeetingId();
            const newUser = {
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
            exports.inMemoryUsers.set(newId, newUser);
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
    static async login(email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        if ((0, db_js_1.getIsMongoConnected)()) {
            const user = await User_js_1.User.findOne({ email: normalizedEmail }).select('+password');
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
                user: user.toSummary(),
            };
        }
        else {
            // In-Memory mode
            seedInMemoryStore();
            let matchedUser;
            for (const u of exports.inMemoryUsers.values()) {
                if (u.email.toLowerCase() === normalizedEmail) {
                    matchedUser = u;
                    break;
                }
            }
            if (!matchedUser) {
                throw new Error('Invalid email or password');
            }
            const isMatch = await bcryptjs_1.default.compare(password, matchedUser.passwordHash);
            if (!isMatch) {
                throw new Error('Invalid email or password');
            }
            const token = generateToken({ userId: matchedUser._id, email: matchedUser.email });
            const pendingCount = matchedUser.friendRequests.filter((r) => r.direction === 'received' && r.status === 'pending').length;
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
    static async demoLogin() {
        const demoEmail = 'demo@superapp.dev';
        if ((0, db_js_1.getIsMongoConnected)()) {
            let demoUser = await User_js_1.User.findOne({ email: demoEmail });
            if (!demoUser) {
                // Create demo friends first in MongoDB
                const friendIds = [];
                for (const df of mockData_js_1.DEMO_FRIENDS) {
                    let friendDoc = await User_js_1.User.findOne({ email: df.email });
                    if (!friendDoc) {
                        friendDoc = await User_js_1.User.create({
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
                    friendIds.push(friendDoc._id);
                }
                // Create Demo User
                demoUser = await User_js_1.User.create({
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
                await User_js_1.User.updateMany({ _id: { $in: friendIds } }, { $addToSet: { friends: demoUser._id } });
                // Add incoming requester
                const requesterDoc = await User_js_1.User.create({
                    name: mockData_js_1.DEMO_PENDING_REQUESTERS[0].name,
                    email: mockData_js_1.DEMO_PENDING_REQUESTERS[0].email,
                    password: 'password123',
                    avatar: mockData_js_1.DEMO_PENDING_REQUESTERS[0].avatar,
                    bio: mockData_js_1.DEMO_PENDING_REQUESTERS[0].bio,
                    personalMeetingId: mockData_js_1.DEMO_PENDING_REQUESTERS[0].personalMeetingId,
                });
                demoUser.friendRequests.push({
                    user: requesterDoc._id,
                    direction: 'received',
                    status: 'pending',
                    createdAt: new Date(),
                });
                await demoUser.save();
            }
            const token = generateToken({ userId: demoUser._id.toString(), email: demoUser.email });
            return {
                token,
                user: demoUser.toSummary(),
            };
        }
        else {
            // In-Memory Demo Login
            seedInMemoryStore();
            const demoUser = exports.inMemoryUsers.get('demo-recruiter-id');
            const token = generateToken({ userId: demoUser._id, email: demoUser.email });
            const pendingCount = demoUser.friendRequests.filter((r) => r.direction === 'received' && r.status === 'pending').length;
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
    static async getCurrentUser(userId) {
        if ((0, db_js_1.getIsMongoConnected)()) {
            const user = await User_js_1.User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user.toSummary();
        }
        else {
            const user = exports.inMemoryUsers.get(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const pendingCount = user.friendRequests.filter((r) => r.direction === 'received' && r.status === 'pending').length;
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
exports.AuthService = AuthService;
