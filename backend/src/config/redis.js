import { createClient } from "redis";

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client has not been initialized");
  }

  return redisClient;
}

export async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on("error", (error) => {
    console.error("Redis client error", error);
  });

  await redisClient.connect();
  console.log("Redis connected");
}
