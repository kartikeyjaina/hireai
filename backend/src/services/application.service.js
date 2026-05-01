import Application from "../models/application.model.js";
import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";

const APPLICATION_POPULATE = [
  { path: "candidate" },
  { path: "job" },
  { path: "owner", select: "firstName lastName email role" },
  { path: "stageHistory.changedBy", select: "firstName lastName email role" }
];

export async function listApplications(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

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

export async function getPipelineBoard(query) {
  const filter = {};

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

export async function getApplicationById(applicationId) {
  const application = await Application.findById(
    toObjectId(applicationId, "applicationId")
  ).populate(APPLICATION_POPULATE);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return application;
}

export async function createApplication(payload, actorId) {
  const candidateId = toObjectId(payload.candidate, "candidate");
  const jobId = toObjectId(payload.job, "job");

  const [candidate, job, existing] = await Promise.all([
    Candidate.findById(candidateId),
    Job.findById(jobId),
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

  return getApplicationById(application._id.toString());
}

export async function updateApplication(applicationId, payload, actorId) {
  const application = await getApplicationById(applicationId);
  const stageChanged = payload.stage && payload.stage !== application.stage;

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
  return getApplicationById(application._id.toString());
}
