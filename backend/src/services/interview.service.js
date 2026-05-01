import Application from "../models/application.model.js";
import Candidate from "../models/candidate.model.js";
import Interview from "../models/interview.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import { createNotifications } from "./notification.service.js";

const INTERVIEW_POPULATE = [
  { path: "application" },
  { path: "job" },
  { path: "candidate" },
  { path: "interviewers", select: "firstName lastName email role" }
];

export async function listInterviews(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.applicationId) {
    filter.application = toObjectId(query.applicationId, "applicationId");
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.candidateId) {
    filter.candidate = toObjectId(query.candidateId, "candidateId");
  }

  if (query.jobId) {
    filter.job = toObjectId(query.jobId, "jobId");
  }

  const [items, total] = await Promise.all([
    Interview.find(filter)
      .populate(INTERVIEW_POPULATE)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit),
    Interview.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getInterviewById(interviewId) {
  const interview = await Interview.findById(
    toObjectId(interviewId, "interviewId")
  ).populate(INTERVIEW_POPULATE);

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  return interview;
}

export async function createInterview(payload) {
  const applicationId = toObjectId(payload.application, "application");
  const candidateId = toObjectId(payload.candidate, "candidate");
  const jobId = toObjectId(payload.job, "job");
  const interviewerIds = (payload.interviewers || []).map((id) =>
    toObjectId(id, "interviewer")
  );

  const [application, candidate, job] = await Promise.all([
    Application.findById(applicationId),
    Candidate.findById(candidateId),
    Job.findById(jobId)
  ]);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const interview = await Interview.create({
    ...payload,
    application: applicationId,
    candidate: candidateId,
    job: jobId,
    interviewers: interviewerIds
  });

  await createNotifications(
    interviewerIds.map((recipient) => ({
      recipient: recipient.toString(),
      type: "interview-scheduled",
      title: "New interview scheduled",
      message: `${payload.title} has been scheduled.`,
      link: `/candidates/${payload.candidate}`,
      metadata: {
        interviewId: interview._id.toString(),
        candidateId: payload.candidate,
        jobId: payload.job
      }
    }))
  );

  return getInterviewById(interview._id.toString());
}

export async function updateInterview(interviewId, payload) {
  const interview = await getInterviewById(interviewId);
  const nextInterviewers = payload.interviewers
    ? payload.interviewers.map((id) => toObjectId(id, "interviewer"))
    : interview.interviewers;

  Object.assign(interview, {
    ...payload,
    interviewers: nextInterviewers
  });

  await interview.save();

  await createNotifications(
    nextInterviewers.map((recipient) => ({
      recipient: recipient.toString(),
      type: "interview-scheduled",
      title: "Interview updated",
      message: `${interview.title} has been updated.`,
      link: `/candidates/${interview.candidate._id.toString()}`,
      metadata: {
        interviewId: interview._id.toString(),
        candidateId: interview.candidate._id.toString(),
        jobId: interview.job._id.toString()
      }
    }))
  );

  return getInterviewById(interview._id.toString());
}
