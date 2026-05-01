import Application from "../models/application.model.js";
import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import { createNotifications } from "./notification.service.js";
import {
  buildApplicationAccessFilter,
  buildCandidateAccessFilter,
  buildJobAccessFilter
} from "./access-control.service.js";

const APPLICATION_POPULATE = [
  { path: "candidate" },
  { path: "job" },
  { path: "owner", select: "firstName lastName email role" },
  { path: "stageHistory.changedBy", select: "firstName lastName email role" }
];

export async function listApplications(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildApplicationAccessFilter(actor);

  if (query.jobId) {
    filter.job = toObjectId(query.jobId, "jobId");
  }

  if (query.candidateId) {
    filter.candidate = toObjectId(query.candidateId, "candidateId");
  }

  if (query.stage) {
    filter.stage = query.stage;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.ownerId) {
    filter.owner = toObjectId(query.ownerId, "ownerId");
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate(APPLICATION_POPULATE)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getPipelineBoard(query, actor) {
  // Candidates don't have access to the pipeline board
  if (actor?.role === "candidate") {
    return {};
  }

  const filter = await buildApplicationAccessFilter(actor);

  if (query.jobId) {
    filter.job = toObjectId(query.jobId, "jobId");
  }

  if (query.status) {
    filter.status = query.status;
  }

  const items = await Application.find(filter)
    .populate(APPLICATION_POPULATE)
    .sort({ updatedAt: -1 });

  return items.reduce((board, item) => {
    if (!board[item.stage]) {
      board[item.stage] = [];
    }

    board[item.stage].push(item);
    return board;
  }, {});
}

export async function getApplicationById(applicationId, actor) {
  const accessFilter = await buildApplicationAccessFilter(actor);
  const application = await Application.findOne({
    _id: toObjectId(applicationId, "applicationId"),
    ...accessFilter
  }).populate(APPLICATION_POPULATE);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return application;
}

export async function createApplication(payload, actorId, actor, options = {}) {
  const {
    skipAccessChecks = false,
    skipNotifications = false,
    returnRaw = false
  } = options;
  const candidateId = toObjectId(payload.candidate, "candidate");
  const jobId = toObjectId(payload.job, "job");
  const [candidateAccessFilter, jobAccessFilter] = skipAccessChecks
    ? [{}, {}]
    : await Promise.all([
        buildCandidateAccessFilter(actor),
        buildJobAccessFilter(actor)
      ]);

  const [candidate, job, existing] = await Promise.all([
    Candidate.findOne({ _id: candidateId, ...candidateAccessFilter }),
    Job.findOne({ _id: jobId, ...jobAccessFilter }),
    Application.findOne({ candidate: candidateId, job: jobId })
  ]);

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (existing) {
    throw new AppError("An application already exists for this candidate and job", 409);
  }

  const application = await Application.create({
    ...payload,
    candidate: candidateId,
    job: jobId,
    owner: payload.owner ? toObjectId(payload.owner, "owner") : null,
    stageHistory: [
      {
        stage: payload.stage,
        changedBy: toObjectId(actorId, "actorId"),
        note: payload.notes || ""
      }
    ]
  });

  if (!skipNotifications) {
    await createNotifications([
      {
        recipient: actorId,
        type: "system",
        title: "Candidate added to pipeline",
        message: "A new application was created in the hiring pipeline.",
        link: `/applications/${application._id.toString()}`,
        metadata: {
          applicationId: application._id.toString(),
          candidateId: candidate._id.toString(),
          jobId: job._id.toString()
        }
      }
    ]);
  }

  if (returnRaw) {
    return application;
  }

  return getApplicationById(application._id.toString(), actor);
}

export async function updateApplication(applicationId, payload, actorId, actor) {
  const application = await getApplicationById(applicationId, actor);
  const stageChanged = payload.stage && payload.stage !== application.stage;
  const previousStage = application.stage;

  if (payload.owner !== undefined) {
    application.owner = payload.owner ? toObjectId(payload.owner, "owner") : null;
  }

  if (payload.status !== undefined) {
    application.status = payload.status;
  }

  if (payload.stage !== undefined) {
    application.stage = payload.stage;
  }

  if (payload.score !== undefined) {
    application.score = payload.score;
  }

  if (payload.notes !== undefined) {
    application.notes = payload.notes;
  }

  if (payload.source !== undefined) {
    application.source = payload.source;
  }

  if (stageChanged) {
    application.stageHistory.push({
      stage: payload.stage,
      changedBy: toObjectId(actorId, "actorId"),
      note: payload.notes || ""
    });
  }

  await application.save();

  if (stageChanged) {
    const recipients = [application.owner?._id?.toString(), actorId]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);

    await createNotifications(
      recipients.map((recipient) => ({
        recipient,
        type: "application-stage-change",
        title: "Application stage updated",
        message: `Application moved from ${previousStage} to ${payload.stage}.`,
        link: `/applications/${application._id.toString()}`,
        metadata: {
          applicationId: application._id.toString(),
          previousStage,
          nextStage: payload.stage
        }
      }))
    );
  }

  return getApplicationById(application._id.toString(), actor);
}

/**
 * Authenticated candidate applies to a published job.
 * Finds or creates a Candidate record linked to the user account,
 * then creates an Application preventing duplicates.
 */
export async function applyAsCandidate(body, actor) {
  const jobId = String(body.jobId || "").trim();

  if (!jobId) {
    throw new AppError("jobId is required", 422);
  }

  const job = await Job.findOne({
    _id: toObjectId(jobId, "jobId"),
    status: "published"
  });

  if (!job) {
    throw new AppError("Job not found or not open for applications", 404);
  }

  const actorId = toObjectId(actor.id, "actorId");

  // Find or create a candidate profile linked to this user account
  let candidate = await Candidate.findOne({ userId: actorId });

  if (!candidate) {
    // Auto-create a minimal candidate profile from the user account
    const User = (await import("../models/user.model.js")).default;
    const user = await User.findById(actorId);

    if (!user) {
      throw new AppError("User account not found", 404);
    }

    candidate = await Candidate.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      source: "candidate-portal",
      createdBy: actorId,
      userId: actorId
    });
  }

  // Prevent duplicate applications
  const existing = await Application.findOne({
    candidate: candidate._id,
    job: job._id
  });

  if (existing) {
    throw new AppError("You have already applied to this job", 409);
  }

  const application = await Application.create({
    candidate: candidate._id,
    job: job._id,
    stage: "applied",
    status: "active",
    source: "candidate-portal",
    notes: "Applied via candidate portal",
    stageHistory: [
      {
        stage: "applied",
        changedBy: actorId,
        note: "Candidate self-applied"
      }
    ]
  });

  return {
    message: "Application submitted successfully",
    applicationId: application._id.toString(),
    candidateId: candidate._id.toString()
  };
}
