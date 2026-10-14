import mongoose from 'mongoose';

let isConnected = false;
let isInMemoryFallback = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      isInMemoryFallback = false;
      console.log('MongoDB Atlas connected successfully.');
      return true;
    } catch (err: any) {
      console.warn(`MongoDB Atlas connection error: ${err.message}. Enabling in-memory fallback mode.`);
      isConnected = false;
      isInMemoryFallback = true;
      return false;
    }
  } else {
    console.log('Notice: MONGODB_URI not configured in environment. Initializing development in-memory data store.');
    isConnected = false;
    isInMemoryFallback = true;
    return false;
  }
};

export const getDBStatus = () => ({
  isConnected,
  isInMemoryFallback,
  dbType: isConnected ? 'MongoDB Atlas (Live)' : 'In-Memory Development Store',
});
