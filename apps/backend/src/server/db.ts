import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

let cached = (global as unknown as { mongoose?: typeof mongoose }).mongoose;

if (!cached) {
  cached = mongoose;
  (global as unknown as { mongoose?: typeof mongoose }).mongoose = cached;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cached.connection.readyState === 1) {
    return cached;
  }
  await cached.connect(MONGODB_URI);
  return cached;
}
