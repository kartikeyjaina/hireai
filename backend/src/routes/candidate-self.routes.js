/**
 * Candidate self-service routes — accessible only to users with role "candidate".
 * These routes let candidates view published jobs, their own profile, and their applications.
 */
import { Router } from "express";
import asyncHandler from "../utils/async-handler.js";
import Job from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import Application from "../models/application.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";

const router = Router();

// GET /api/candidate/jobs — published jobs with pagination
router.get(
  "/jobs",
  asyncHandler(async (request, response) => {
    const { page, limit, skip } = parsePagination(request.query);
    const filter = { status: "published" };

    if (request.query.department) {
      filter.department = request.query.department;
    }

    const [items, total] = await Promise.all([
      Job.find(filter)
        .select("-semanticEmbedding")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter)
    ]);

    response.status(200).json({ items, pagination: { page, limit, total } });
  })
);

// GET /api/candidate/jobs/:jobId — single published job
router.get(
  "/jobs/:jobId",
  asyncHandler(async (request, response) => {
    const job = await Job.findOne({
      _id: toObjectId(request.params.jobId, "jobId"),
      status: "published"
    })
      .select("-semanticEmbedding")
      .lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    response.status(200).json({ job });
  })
);

// GET /api/candidate/profile — own candidate profile
router.get(
  "/profile",
  asyncHandler(async (request, response) => {
    const actorId = toObjectId(request.user.id, "actorId");
    const candidate = await Candidate.findOne({ userId: actorId })
      .select("-semanticEmbedding -parsedResumeText")
      .lean();

    response.status(200).json({ candidate: candidate || null });
  })
);

// GET /api/candidate/applications — own applications
router.get(
  "/applications",
  asyncHandler(async (request, response) => {
    const { page, limit, skip } = parsePagination(request.query);
    const actorId = toObjectId(request.user.id, "actorId");
    const candidate = await Candidate.findOne({ userId: actorId }).select("_id").lean();

    if (!candidate) {
      return response.status(200).json({
        items: [],
        pagination: { page, limit, total: 0 }
      });
    }

    const filter = { candidate: candidate._id };

    const [items, total] = await Promise.all([
      Application.find(filter)
        .populate([
          { path: "job", select: "title department location status employmentType experienceLevel" },
          { path: "stageHistory.changedBy", select: "firstName lastName" }
        ])
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter)
    ]);

    response.status(200).json({ items, pagination: { page, limit, total } });
  })
);

export default router;
