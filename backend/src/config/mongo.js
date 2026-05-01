import mongoose from "mongoose";

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== "production"
  });

  console.log("MongoDB connected");
}
