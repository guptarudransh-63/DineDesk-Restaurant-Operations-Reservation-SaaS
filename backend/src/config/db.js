import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinedesk';
    
    // Attempt connecting to configured/local MongoDB with 2.5s timeout
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`Connected to MongoDB at ${mongoUri}`);
      return;
    } catch (err) {
      console.warn(`Local MongoDB not reachable (${err.message}). Starting embedded MongoMemoryServer...`);
    }

    // Fallback: embedded MongoMemoryServer so the app runs self-contained anywhere without needing external setup
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to In-Memory MongoDB Server at ${uri}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
