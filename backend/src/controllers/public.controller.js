import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import Application from "../models/application.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { extractTextFromFile } from "../utils/file-text.js";
import { parseResume } from "../services/ai.service.js";
import { createCandidate } from "../services/candidate.service.js";
import { createApplication } from "../services/application.service.js";
import { enqueueBackgroundJob } from "../services/background-job.service.js";
import { toObjectId } from "../utils/object-id.js";

export const listJobs = asyncHandler(async (request, response) => {
  const jobs = await Job.find({ status: "published" }).sort({ createdAt: -1 }).lean();

  response.json({ items: jobs });
});

export const getJob = asyncHandler(async (request, response) => {
  const jobId = request.params.jobId;

  const job = await Job.findOne({ _id: toObjectId(jobId, "jobId"), status: "published" });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  response.json({ job });
});

export const applyToJob = asyncHandler(async (request, response) => {
  const { jobId, firstName, lastName, email, phone } = request.validatedBody;

  const job = await Job.findOne({ _id: toObjectId(jobId, "jobId"), status: "published" });

  if (!job) {
    throw new AppError("Job not found or not open for public applications", 404);
  }

  // extract resume text if file provided
  let resumeText = "";

  if (request.file && request.file.buffer) {
    resumeText = await extractTextFromFile(request.file);
  }

  // Parse resume (best-effort). Non-blocking parts handled later.
  let parsedProfile = null;

  try {
    if (resumeText) {
      parsedProfile = await parseResume({ resumeText });
    }
  } catch (error) {
    console.error("Resume parsing failed", { message: error?.message });
    parsedProfile = null;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  let candidate = await Candidate.findOne({ email: normalizedEmail });

  // create a surrogate actor id for public actions
  const publicActorId = new mongoose.Types.ObjectId();

  if (!candidate) {
    const payload = {
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      parsedResumeText: resumeText || (parsedProfile && parsedProfile.summary) || "",
      source: "public"
    };

    candidate = await createCandidate(payload, publicActorId.toString(), {
      skipNotification: true,
      returnRaw: true
    });
  }

  // Prevent duplicate applications
  const existingApp = await Application.findOne({ candidate: candidate._id, job: job._id });

  if (existingApp) {
    throw new AppError("An application already exists for this email and job", 409);
  }

  const application = await createApplication({
    candidate: candidate._id.toString(),
    job: job._id.toString(),
    stage: "applied",
    status: "active",
    source: "public",
    notes: "Public application submitted"
  }, publicActorId.toString(), { role: "admin", id: publicActorId.toString() }, {
    skipAccessChecks: true,
    skipNotifications: true,
    returnRaw: true
  });

  // enqueue optional background scoring
  enqueueBackgroundJob("public-application-scoring", async () => {
    try {
      // attempt parse if not parsed
      const finalParsed = parsedProfile || (resumeText ? await parseResume({ resumeText }) : null);

      if (!finalParsed) return;

      // compute score using ai.service scoreCandidate if available
      // lazy-require to avoid cycles
      const { scoreCandidate } = await import("../services/ai.service.js");
      const score = await scoreCandidate({
        candidateProfile: finalParsed,
        jobTitle: job.title,
        jobDescription: job.description,
        mustHaveSkills: job.skills || []
      });

      await Application.updateOne(
        { _id: application._id },
        { $set: { score: score.score, notes: score.summary || application.notes } }
      );
    } catch (error) {
      console.error("Background scoring failed", { message: error?.message });
    }
  });

  response.status(201).json({ message: "Application submitted successfully", applicationId: application._id.toString() });
});

export default {
  listJobs,
  getJob,
  applyToJob
};
