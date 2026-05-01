import Application from "../models/application.model.js";
import Candidate from "../models/candidate.model.js";
import Interview from "../models/interview.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";

function getActorObjectId(actor) {
  if (!actor?.id) {
    throw new AppError("Authenticated user context is required", 401);
  }

  return toObjectId(actor.id, "actorId");
}

export function assertCanWriteHiringData(actor) {
  if (!actor || !["admin", "recruiter"].includes(actor.role)) {
    throw new AppError("You do not have permission to perform this action", 403);
  }
}

export async function buildJobAccessFilter(actor) {
  if (actor?.role === "admin") {
    return {};
  }

  const actorId = getActorObjectId(actor);

  if (actor?.role === "recruiter") {
    return {
      $or: [{ createdBy: actorId }, { hiringManager: actorId }]
    };
  }

  const interviews = await Interview.find({ interviewers: actorId })
    .select("job")
    .lean();
  const jobIds = [...new Set(interviews.map((item) => String(item.job)).filter(Boolean))].map(
    (id) => toObjectId(id, "jobId")
  );

  return {
    _id: { $in: jobIds }
  };
}

export async function buildCandidateAccessFilter(actor) {
  if (actor?.role === "admin") {
    return {};
  }

  const actorId = getActorObjectId(actor);

  if (actor?.role === "recruiter") {
    return {
      createdBy: actorId
    };
  }

  const interviews = await Interview.find({ interviewers: actorId })
    .select("candidate")
    .lean();
  const candidateIds = [...new Set(interviews.map((item) => String(item.candidate)).filter(Boolean))].map(
    (id) => toObjectId(id, "candidateId")
  );

  return {
    _id: { $in: candidateIds }
  };
}

export async function buildApplicationAccessFilter(actor) {
  if (actor?.role === "admin") {
    return {};
  }

  const actorId = getActorObjectId(actor);

  if (actor?.role === "recruiter") {
    const [jobs, candidates] = await Promise.all([
      Job.find({
        $or: [{ createdBy: actorId }, { hiringManager: actorId }]
      })
        .select("_id")
        .lean(),
      Candidate.find({ createdBy: actorId }).select("_id").lean()
    ]);

    const jobIds = jobs.map((job) => job._id);
    const candidateIds = candidates.map((candidate) => candidate._id);

    return {
      $or: [{ owner: actorId }, { job: { $in: jobIds } }, { candidate: { $in: candidateIds } }]
    };
  }

  const interviews = await Interview.find({ interviewers: actorId })
    .select("application")
    .lean();
  const applicationIds = [...new Set(interviews.map((item) => String(item.application)).filter(Boolean))].map(
    (id) => toObjectId(id, "applicationId")
  );

  return {
    _id: { $in: applicationIds }
  };
}

export async function buildInterviewAccessFilter(actor) {
  if (actor?.role === "admin") {
    return {};
  }

  const actorId = getActorObjectId(actor);

  if (actor?.role === "recruiter") {
    const jobs = await Job.find({
      $or: [{ createdBy: actorId }, { hiringManager: actorId }]
    })
      .select("_id")
      .lean();

    return {
      job: { $in: jobs.map((job) => job._id) }
    };
  }

  return {
    interviewers: actorId
  };
}
