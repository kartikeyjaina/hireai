import Application from "../models/application.model.js";
import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import {
  cosineSimilarity,
  generateEmbedding,
  parseResume,
  scoreCandidate,
} from "./ai.service.js";
import { enqueueBackgroundJob } from "./background-job.service.js";
import {
  buildApplicationAccessFilter,
  buildCandidateAccessFilter,
  buildJobAccessFilter,
} from "./access-control.service.js";
import { createNotification } from "./notification.service.js";

const CANDIDATE_POPULATE = [
  { path: "createdBy", select: "firstName lastName email role" },
];

function sanitizeResumeFields(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMinimalCandidateProfile(resumeText) {
  const normalizedText = String(resumeText || "");
  const lines = normalizedText
    .split(/\n+/)
    .map((line) => sanitizeResumeFields(line))
    .filter(Boolean);
  const fullName =
    lines.find(
      (line) =>
        line.split(/\s+/).filter(Boolean).length >= 2 && !/@/.test(line),
    ) ||
    lines[0] ||
    "Candidate Profile";
  const emailMatch = normalizedText.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  );
  const phoneMatch = normalizedText.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/,
  );
  const summary = sanitizeResumeFields(lines.slice(0, 4).join(" ")).slice(
    0,
    600,
  );

  return {
    fullName,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    location: "",
    currentTitle: "",
    summary,
    totalYearsExperience: 0,
    skills: [],
    workExperience: [],
    education: [],
    certifications: [],
  };
}

function splitCandidateName(fullName) {
  const nameParts = sanitizeResumeFields(fullName).split(/\s+/).filter(Boolean);

  if (!nameParts.length) {
    return {
      firstName: "Candidate",
      lastName: "Profile",
    };
  }

  return {
    firstName: nameParts[0] || "Candidate",
    lastName: nameParts.slice(1).join(" ") || "Profile",
  };
}

async function generateEmbeddingSafely(text) {
  try {
    return await generateEmbedding({ text });
  } catch (error) {
    console.error("Candidate embedding generation failed", {
      message: error?.message,
    });
    return [];
  }
}

export async function listCandidates(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildCandidateAccessFilter(actor);
  const searchProjection = query.search
    ? { score: { $meta: "textScore" } }
    : undefined;

  if (query.source) {
    filter.source = query.source;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Candidate.find(filter)
      .select(searchProjection)
      .populate(CANDIDATE_POPULATE)
      .sort(
        query.search
          ? { score: { $meta: "textScore" }, createdAt: -1 }
          : { createdAt: -1 },
      )
      .skip(skip)
      .limit(limit),
    Candidate.countDocuments(filter),
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getCandidateById(candidateId, actor) {
  const accessFilter = await buildCandidateAccessFilter(actor);
  const candidate = await Candidate.findOne({
    _id: toObjectId(candidateId, "candidateId"),
    ...accessFilter,
  }).populate(CANDIDATE_POPULATE);

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  return candidate;
}

export async function getCandidateProfile(candidateId, actor) {
  const candidate = await getCandidateById(candidateId, actor);
  const applicationAccessFilter = await buildApplicationAccessFilter(actor);
  const applications = await Application.find({
    ...applicationAccessFilter,
    candidate: candidate._id,
  })
    .populate([
      { path: "job" },
      { path: "owner", select: "firstName lastName email role" },
    ])
    .sort({ updatedAt: -1 });

  return {
    candidate,
    applications,
  };
}

export async function createCandidate(payload, actorId, options = {}) {
  const { skipNotification = false, returnRaw = false } = options;
  const embeddingText = [
    payload.firstName,
    payload.lastName,
    payload.currentTitle,
    payload.summary,
    ...(payload.skills || []),
  ]
    .filter(Boolean)
    .join("\n");
  const semanticEmbedding = await generateEmbeddingSafely(embeddingText);

  const candidate = await Candidate.create({
    ...payload,
    createdBy: toObjectId(actorId, "actorId"),
    semanticEmbedding,
    embeddingUpdatedAt: semanticEmbedding.length ? new Date() : null,
  });

  if (!skipNotification) {
    await createNotification({
      recipient: actorId,
      type: "system",
      title: "Candidate added",
      message: `${candidate.firstName} ${candidate.lastName} was added to your talent pipeline.`,
      link: `/candidates/${candidate._id.toString()}`,
      metadata: {
        candidateId: candidate._id.toString(),
      },
    });
  }

  if (returnRaw) {
    return candidate;
  }

  return getCandidateById(candidate._id.toString(), {
    id: actorId,
    role: "admin",
  });
}

export async function createCandidateFromResume({
  actorId,
  candidateProfile,
  parsedResumeText,
  source = "resume-upload",
}) {
  const { firstName, lastName } = splitCandidateName(candidateProfile.fullName);
  const embeddingText = [
    candidateProfile.fullName,
    candidateProfile.currentTitle,
    candidateProfile.summary,
    ...(candidateProfile.skills || []),
  ]
    .filter(Boolean)
    .join("\n");
  const semanticEmbedding = await generateEmbeddingSafely(embeddingText);

  const candidate = await Candidate.create({
    firstName,
    lastName,
    email: candidateProfile.email || `${Date.now()}@missing-email.local`,
    phone: candidateProfile.phone || "",
    location: candidateProfile.location || "",
    currentTitle: candidateProfile.currentTitle || "",
    yearsExperience: Number(candidateProfile.totalYearsExperience) || 0,
    source,
    summary: candidateProfile.summary || "",
    skills: Array.isArray(candidateProfile.skills)
      ? candidateProfile.skills
      : [],
    tags: [],
    parsedResumeText,
    createdBy: toObjectId(actorId, "actorId"),
    semanticEmbedding,
    embeddingUpdatedAt: semanticEmbedding.length ? new Date() : null,
  });

  await createNotification({
    recipient: actorId,
    type: "system",
    title: "Candidate parsed from resume",
    message: `${candidate.firstName} ${candidate.lastName} profile was created from resume upload.`,
    link: `/candidates/${candidate._id.toString()}`,
    metadata: {
      candidateId: candidate._id.toString(),
      source,
    },
  });

  return getCandidateById(candidate._id.toString(), {
    id: actorId,
    role: "admin",
  });
}

export async function parseResumeAndCreateCandidate({
  actor,
  actorId,
  resumeText,
  targetRole,
  companyContext,
  jobId,
}) {
  const fallbackProfile = extractMinimalCandidateProfile(resumeText);
  const candidate = await createCandidateFromResume({
    actorId,
    candidateProfile: fallbackProfile,
    parsedResumeText: resumeText,
  });

  let application = null;

  if (jobId) {
    const jobAccessFilter = await buildJobAccessFilter(actor);
    const job = await Job.findOne({
      _id: toObjectId(jobId, "jobId"),
      ...jobAccessFilter,
    });

    if (job) {
      application = await Application.create({
        candidate: candidate._id,
        job: job._id,
        stage: "applied",
        status: "active",
        score: null,
        source: "resume-upload",
        notes: "Resume uploaded. AI parsing will complete in the background.",
        stageHistory: [
          {
            stage: "applied",
            changedBy: toObjectId(actorId, "actorId"),
            note: "Created from resume upload",
          },
        ],
      });
    } else {
      console.error("Resume upload linked job was not found or inaccessible", {
        actorId,
        jobId,
      });
    }
  }

  enqueueBackgroundJob("resume-upload-enrichment", async () => {
    let parsedProfile = fallbackProfile;

    try {
      parsedProfile = await parseResume({
        resumeText,
        targetRole,
        companyContext,
      });
    } catch (error) {
      console.error("AI resume parsing failed, keeping fallback profile", {
        actorId,
        message: error?.message,
      });
    }

    const embeddingText = [
      parsedProfile.fullName,
      parsedProfile.currentTitle,
      parsedProfile.summary,
      ...(parsedProfile.skills || []),
    ]
      .filter(Boolean)
      .join("\n");
    const semanticEmbedding = await generateEmbeddingSafely(embeddingText);

    await Candidate.updateOne(
      { _id: candidate._id },
      {
        $set: {
          firstName: splitCandidateName(parsedProfile.fullName).firstName,
          lastName: splitCandidateName(parsedProfile.fullName).lastName,
          email: parsedProfile.email || candidate.email,
          phone: parsedProfile.phone || candidate.phone,
          location: parsedProfile.location || candidate.location,
          currentTitle: parsedProfile.currentTitle || candidate.currentTitle,
          yearsExperience:
            Number(parsedProfile.totalYearsExperience) ||
            candidate.yearsExperience,
          summary: parsedProfile.summary || candidate.summary,
          skills: Array.isArray(parsedProfile.skills)
            ? parsedProfile.skills
            : candidate.skills,
          semanticEmbedding,
          embeddingUpdatedAt: semanticEmbedding.length
            ? new Date()
            : candidate.embeddingUpdatedAt,
        },
      },
    );

    if (application) {
      try {
        const job = await Job.findById(application.job);

        if (!job) {
          return;
        }

        const score = await scoreCandidate({
          candidateProfile: parsedProfile,
          jobTitle: job.title,
          jobDescription: job.description,
          mustHaveSkills: job.skills || [],
        });

        await Application.updateOne(
          { _id: application._id },
          {
            $set: {
              score: score.score,
              notes: score.summary || application.notes,
            },
          },
        );
      } catch (error) {
        console.error("AI scoring failed during resume background processing", {
          actorId,
          applicationId: application._id.toString(),
          message: error?.message,
        });
      }
    }
  });

  return {
    parsed: fallbackProfile,
    candidate,
    score: null,
    application,
  };
}

export async function updateCandidate(candidateId, payload, actor) {
  const candidate = await getCandidateById(candidateId, actor);
  const embeddingText = [
    payload.firstName ?? candidate.firstName,
    payload.lastName ?? candidate.lastName,
    payload.currentTitle ?? candidate.currentTitle,
    payload.summary ?? candidate.summary,
    ...((payload.skills ?? candidate.skills) || []),
  ]
    .filter(Boolean)
    .join("\n");
  const semanticEmbedding = await generateEmbeddingSafely(embeddingText);

  Object.assign(candidate, payload);
  candidate.semanticEmbedding = semanticEmbedding;
  candidate.embeddingUpdatedAt = semanticEmbedding.length ? new Date() : null;
  await candidate.save();
  return getCandidateById(candidate._id.toString(), actor);
}

export async function semanticSearchCandidates({
  jobId,
  query,
  limit = 20,
  actor,
}) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  let searchText = String(query || "").trim();
  let job = null;

  if (jobId) {
    const jobAccessFilter = await buildJobAccessFilter(actor);
    job = await Job.findOne({
      _id: toObjectId(jobId, "jobId"),
      ...jobAccessFilter,
    });

    if (!job) {
      throw new AppError("Job not found", 404);
    }
  }

  if (!searchText && !job) {
    throw new AppError(
      "Either query or jobId is required for semantic search",
      422,
    );
  }

  if (!searchText && job) {
    searchText = `${job.title}\n${job.description}\n${(job.skills || []).join(", ")}`;
  }

  const queryEmbedding = await generateEmbedding({
    text: searchText,
  });

  const accessFilter = await buildCandidateAccessFilter(actor);
  const candidates = await Candidate.find({
    ...accessFilter,
    semanticEmbedding: { $exists: true, $ne: [] },
  })
    .populate(CANDIDATE_POPULATE)
    .limit(200);

  const items = candidates
    .map((candidate) => ({
      candidate,
      semanticScore: cosineSimilarity(
        queryEmbedding,
        candidate.semanticEmbedding || [],
      ),
    }))
    .sort((left, right) => right.semanticScore - left.semanticScore)
    .slice(0, normalizedLimit);

  return {
    items,
    job,
  };
}

export async function rankCandidatesForJob(jobId, actor) {
  const jobAccessFilter = await buildJobAccessFilter(actor);
  const job = await Job.findOne({
    _id: toObjectId(jobId, "jobId"),
    ...jobAccessFilter,
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const candidateAccessFilter = await buildCandidateAccessFilter(actor);
  const candidates = await Candidate.find({
    ...candidateAccessFilter,
    semanticEmbedding: { $exists: true, $ne: [] },
  }).limit(100);

  const rankings = [];

  for (const candidate of candidates) {
    const semanticScore = cosineSimilarity(
      job.semanticEmbedding || [],
      candidate.semanticEmbedding || [],
    );

    const aiScore = await scoreCandidate({
      candidateProfile: {
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        currentTitle: candidate.currentTitle,
        summary: candidate.summary,
        skills: candidate.skills,
        totalYearsExperience: candidate.yearsExperience,
      },
      jobTitle: job.title,
      jobDescription: job.description,
      mustHaveSkills: job.skills || [],
    });

    rankings.push({
      candidate,
      semanticScore,
      aiScore,
      combinedScore:
        Math.round((semanticScore * 100 * 0.35 + aiScore.score * 0.65) * 100) /
        100,
    });
  }

  rankings.sort((left, right) => right.combinedScore - left.combinedScore);

  return {
    job,
    items: rankings,
  };
}
