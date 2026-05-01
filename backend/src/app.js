import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { requireAuth } from "./middleware/auth.middleware.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import healthRoutes from "./routes/health.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_request, response) => {
  response.json({
    name: "HireAI API",
    status: "ok"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/users", requireAuth, userRoutes);
app.use("/api/jobs", requireAuth, jobRoutes);
app.use("/api/candidates", requireAuth, candidateRoutes);
app.use("/api/applications", requireAuth, applicationRoutes);
app.use("/api/interviews", requireAuth, interviewRoutes);
app.use("/api/comments", requireAuth, commentRoutes);
app.use("/api/notifications", requireAuth, notificationRoutes);
app.use(errorHandler);

export default app;
