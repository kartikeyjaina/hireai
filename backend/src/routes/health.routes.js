import { Router } from "express";
import mongoose from "mongoose";
import { getRedisClient } from "../config/redis.js";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    const redis = getRedisClient();
    const redisPing = redis ? await redis.ping() : null;

    response.json({
      status: "ok",
      services: {
        api: "up",
        mongodb: mongoose.connection.readyState === 1 ? "up" : "down",
        redis: redisPing === "PONG" ? "up" : "disabled",
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
