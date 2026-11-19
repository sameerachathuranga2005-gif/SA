import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IFriendRequest } from '../types/index.js';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSummary(): Record<string, any>;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    direction: {
      type: String,
      enum: ['sent', 'received'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: function (this: any) {
        const seed = encodeURIComponent(this.name || 'User');
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      },
    },
    bio: {
      type: String,
      default: 'SuperApp explorer | Ready for chats & meetings',
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    friendRequests: [FriendRequestSchema],
    personalMeetingId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe representation for frontend
UserSchema.methods.toSummary = function () {
  return {
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    personalMeetingId: this.personalMeetingId,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
    friendsCount: this.friends ? this.friends.length : 0,
    pendingRequestsCount: this.friendRequests
      ? this.friendRequests.filter((r: any) => r.direction === 'received' && r.status === 'pending').length
      : 0,
  };
};

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);
export default User;

