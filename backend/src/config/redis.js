import { createClient } from "redis";

let redisClient;
let redisEnabled = false;

export function getRedisClient() {
  return redisClient;
}

export function isRedisEnabled() {
  return redisEnabled;
}

export async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL is not configured. Continuing without Redis cache.");
    redisEnabled = false;
    redisClient = null;
    return;
  }

  if (!/^redis:\/\//i.test(redisUrl)) {
    console.warn("REDIS_URL must start with redis://. Continuing without Redis cache.");
    redisEnabled = false;
    redisClient = null;
    return;
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 150, 2000)
      }
    });

    redisClient.on("error", (error) => {
      console.error("Redis client error", error);
    });

    await redisClient.connect();
    redisEnabled = true;
    console.log("Redis connected");
  } catch (error) {
    redisEnabled = false;
    redisClient = null;
    console.warn("Redis connection failed. Continuing without Redis cache.", error.message);
  }
}
