/* ====================================================
   lib/mongodb.js
   Mongoose connection with caching for Next.js dev hot-reload.
   ==================================================== */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please set MONGODB_URI in your .env.local file.\n' +
    'Example: MONGODB_URI=mongodb://127.0.0.1:27017/prepiq'
  );
}

/**
 * Global cache so Next.js dev hot-reload doesn't create a new
 * connection on every file change.
 */
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
