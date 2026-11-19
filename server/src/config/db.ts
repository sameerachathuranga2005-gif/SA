import mongoose from 'mongoose';

let isMongoConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/superapp';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
    return true;
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(
      `[MongoDB] Warning: Could not connect to MongoDB at "${uri}". (${error.message})`
    );
    console.info(
      `[Storage] Running in Standalone In-Memory Datastore mode. All auth, 1-click recruiter demo, search, and friend requests will operate seamlessly!`
    );
    return false;
  }
};

export const getIsMongoConnected = (): boolean => isMongoConnected;

