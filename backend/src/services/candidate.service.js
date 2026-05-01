import Candidate from "../models/candidate.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import {
  cosineSimilarity,
  generateEmbedding,
  parseResume,
  scoreCandidate
} from "./ai.service.js";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";

const CANDIDATE_POPULATE = [{ path: "createdBy", select: "firstName lastName email role" }];

export async function listCandidates(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.source) {
    filter.source = query.source;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Candidate.find(filter)
      .populate(CANDIDATE_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Candidate.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getCandidateById(candidateId) {
  const candidate = await Candidate.findById(
    toObjectId(candidateId, "candidateId")
  ).populate(CANDIDATE_POPULATE);

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  return candidate;
}

export async function getCandidateProfile(candidateId) {
  const candidate = await getCandidateById(candidateId);
  const applications = await Application.find({
    candidate: candidate._id
  })
    .populate([
      { path: "job" },
      { path: "owner", select: "firstName lastName email role" }
    ])
    .sort({ updatedAt: -1 });

  return {
    candidate,
    applications
  };
}

export async function createCandidate(payload, actorId) {
  const semanticEmbedding = await generateEmbedding({
    text: [
      payload.firstName,
      payload.lastName,
      payload.currentTitle,
      payload.summary,
      ...(payload.skills || [])
    ]
      .filter(Boolean)
      .join("\n")
  });

  const candidate = await Candidate.create({
    ...payload,
    createdBy: toObjectId(actorId, "actorId"),
    semanticEmbedding,
    embeddingUpdatedAt: new Date()
  });

  return getCandidateById(candidate._id.toString());
}

export async function createCandidateFromResume({
  actorId,
  parsedResume,
  parsedResumeText,
  source = "resume-upload"
}) {
  const fullNameParts = String(parsedResume.fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = fullNameParts[0] || "Candidate";
  const lastName = fullNameParts.slice(1).join(" ") || "Profile";

  const candidate = await Candidate.create({
    firstName,
    lastName,
    email: parsedResume.email || `${Date.now()}@missing-email.local`,
    phone: parsedResume.phone || "",
    location: parsedResume.location || "",
    currentTitle: parsedResume.currentTitle || "",
    yearsExperience: Number(parsedResume.totalYearsExperience) || 0,
    source,
    summary: parsedResume.summary || "",
    skills: Array.isArray(parsedResume.skills) ? parsedResume.skills : [],
    tags: [],
    parsedResumeText,
    createdBy: toObjectId(actorId, "actorId"),
    semanticEmbedding: await generateEmbedding({
      text: [
        parsedResume.fullName,
        parsedResume.currentTitle,
        parsedResume.summary,
        ...(parsedResume.skills || [])
      ]
        .filter(Boolean)
        .join("\n")
    }),
    embeddingUpdatedAt: new Date()
  });

  return getCandidateById(candidate._id.toString());
}

export async function parseResumeAndCreateCandidate({
  actorId,
  resumeText,
  targetRole,
  companyContext,
  jobId
}) {
  const parsed = await parseResume({
    resumeText,
    targetRole,
    companyContext
  });

  const candidate = await createCandidateFromResume({
    actorId,
    parsedResume: parsed,
    parsedResumeText: resumeText
  });

  let score = null;
  let application = null;

  if (jobId) {
    const job = await Job.findById(toObjectId(jobId, "jobId"));

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    const scoring = await scoreCandidate({
      candidateProfile: parsed,
      jobTitle: job.title,
      jobDescription: job.description,
      mustHaveSkills: job.skills || []
    });

    score = scoring;

    application = await Application.create({
      candidate: candidate._id,
      job: job._id,
      stage: "applied",
      status: "active",
      score: scoring.score,
      source: "resume-upload",
      notes: scoring.summary,
      stageHistory: [
        {
          stage: "applied",
          changedBy: toObjectId(actorId, "actorId"),
          note: "Created from resume upload"
        }
      ]
    });
  }

  return {
    parsed,
    candidate,
    score,
    application
  };
}

export async function updateCandidate(candidateId, payload) {
  const candidate = await getCandidateById(candidateId);
  const semanticEmbedding = await generateEmbedding({
    text: [
      payload.firstName ?? candidate.firstName,
      payload.lastName ?? candidate.lastName,
      payload.currentTitle ?? candidate.currentTitle,
      payload.summary ?? candidate.summary,
      ...((payload.skills ?? candidate.skills) || [])
    ]
      .filter(Boolean)
      .join("\n")
  });
  Object.assign(candidate, payload);
  candidate.semanticEmbedding = semanticEmbedding;
  candidate.embeddingUpdatedAt = new Date();
  await candidate.save();
  return getCandidateById(candidate._id.toString());
}

export async function semanticSearchCandidates({ jobId, query, limit = 20 }) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  let searchText = String(query || "").trim();
  let job = null;

  if (jobId) {
    job = await Job.findById(toObjectId(jobId, "jobId"));

    if (!job) {
      throw new AppError("Job not found", 404);
    }
  }

  if (!searchText && !job) {
    throw new AppError("Either query or jobId is required for semantic search", 422);
  }

  if (!searchText && job) {
    searchText = `${job.title}\n${job.description}\n${(job.skills || []).join(", ")}`;
  }

  const queryEmbedding = await generateEmbedding({
    text: searchText
  });

  const candidates = await Candidate.find({
    semanticEmbedding: { $exists: true, $ne: [] }
  })
    .populate(CANDIDATE_POPULATE)
    .limit(200);

  const items = candidates
    .map((candidate) => ({
      candidate,
      semanticScore: cosineSimilarity(queryEmbedding, candidate.semanticEmbedding || [])
    }))
    .sort((left, right) => right.semanticScore - left.semanticScore)
    .slice(0, normalizedLimit);

  return {
    items,
    job
  };
}

export async function rankCandidatesForJob(jobId) {
  const job = await Job.findById(toObjectId(jobId, "jobId"));

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const candidates = await Candidate.find({
    semanticEmbedding: { $exists: true, $ne: [] }
  }).limit(100);

  const rankings = [];

  for (const candidate of candidates) {
    const semanticScore = cosineSimilarity(
      job.semanticEmbedding || [],
      candidate.semanticEmbedding || []
    );

    const aiScore = await scoreCandidate({
      candidateProfile: {
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        currentTitle: candidate.currentTitle,
        summary: candidate.summary,
        skills: candidate.skills,
        totalYearsExperience: candidate.yearsExperience
      },
      jobTitle: job.title,
      jobDescription: job.description,
      mustHaveSkills: job.skills || []
    });

    rankings.push({
      candidate,
      semanticScore,
      aiScore,
      combinedScore: Math.round((semanticScore * 100 * 0.35 + aiScore.score * 0.65) * 100) / 100
    });
  }

  rankings.sort((left, right) => right.combinedScore - left.combinedScore);

  return {
    job,
    items: rankings
  };
}
