import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import { generateEmbedding } from "./ai.service.js";
import { buildJobAccessFilter } from "./access-control.service.js";

const JOB_POPULATE = [
  { path: "createdBy", select: "firstName lastName email role" },
  { path: "hiringManager", select: "firstName lastName email role" }
];

export async function listJobs(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildJobAccessFilter(actor);

  if (query.status) {
    // Candidates are already filtered to published; don't let them override
    if (actor?.role !== "candidate") {
      filter.status = query.status;
    }
  }

  if (query.department) {
    filter.department = query.department;
  }

  const [items, total] = await Promise.all([
    Job.find(filter)
      .select("-semanticEmbedding")
      .populate(JOB_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getJobById(jobId, actor) {
  const accessFilter = await buildJobAccessFilter(actor);
  const job = await Job.findOne({
    _id: toObjectId(jobId, "jobId"),
    ...accessFilter
  })
    .select("-semanticEmbedding")
    .populate(JOB_POPULATE);

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  return job;
}

export async function createJob(payload, actorId) {
  const semanticEmbedding = await generateEmbedding({
    text: `${payload.title}\n${payload.department}\n${payload.description}\n${(payload.skills || []).join(", ")}`
  });

  const job = await Job.create({
    ...payload,
    createdBy: toObjectId(actorId, "actorId"),
    hiringManager: payload.hiringManager
      ? toObjectId(payload.hiringManager, "hiringManager")
      : null,
    semanticEmbedding,
    embeddingUpdatedAt: new Date()
  });

  return getJobById(job._id.toString(), { id: actorId, role: "admin" });
}

export async function updateJob(jobId, payload, actor) {
  const job = await getJobById(jobId, actor);
  const nextTitle = payload.title ?? job.title;
  const nextDepartment = payload.department ?? job.department;
  const nextDescription = payload.description ?? job.description;
  const nextSkills = payload.skills ?? job.skills;
  const semanticEmbedding = await generateEmbedding({
    text: `${nextTitle}\n${nextDepartment}\n${nextDescription}\n${(nextSkills || []).join(", ")}`
  });

  Object.assign(job, {
    ...payload,
    hiringManager: payload.hiringManager
      ? toObjectId(payload.hiringManager, "hiringManager")
      : payload.hiringManager === null
        ? null
        : job.hiringManager,
    semanticEmbedding,
    embeddingUpdatedAt: new Date()
  });
  await job.save();
  return getJobById(job._id.toString(), actor);
}
