import { Router } from "express";
import mongoose from "mongoose";
import { getRedisClient } from "../config/redis.js";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    const redis = getRedisClient();
    const redisPing = await redis.ping();

    response.json({
      status: "ok",
      services: {
        api: "up",
        mongodb: mongoose.connection.readyState === 1 ? "up" : "down",
        redis: redisPing === "PONG" ? "up" : "down"
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
