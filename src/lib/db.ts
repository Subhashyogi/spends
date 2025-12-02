import mongoose from 'mongoose';

let cached = (global as any).mongooseConn as { conn: any; promise: Promise<any> | null } | undefined;

if (!cached) {
  (global as any).mongooseConn = { conn: null, promise: null };
  cached = (global as any).mongooseConn;
}

export default async function connectToDatabase() {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    try {
      cached!.promise = mongoose.connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        dbName: process.env.MONGODB_DB,
      });
    } catch (err: any) {
      console.error('[DB] Failed to start connection:', err?.message || err);
      throw err;
    }
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (err: any) {
    console.error('[DB] Connection error:', err?.message || err);
    throw err;
  }
  return cached!.conn;
}
