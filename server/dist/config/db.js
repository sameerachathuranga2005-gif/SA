"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsMongoConnected = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let isMongoConnected = false;
const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/superapp';
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 2500,
        });
        isMongoConnected = true;
        console.log(`[MongoDB] Connected successfully to: ${uri}`);
        return true;
    }
    catch (error) {
        isMongoConnected = false;
        console.warn(`[MongoDB] Warning: Could not connect to MongoDB at "${uri}". (${error.message})`);
        console.info(`[Storage] Running in Standalone In-Memory Datastore mode. All auth, 1-click recruiter demo, search, and friend requests will operate seamlessly!`);
        return false;
    }
};
exports.connectDB = connectDB;
const getIsMongoConnected = () => isMongoConnected;
exports.getIsMongoConnected = getIsMongoConnected;
