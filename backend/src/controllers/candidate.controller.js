import asyncHandler from "../utils/async-handler.js";
import {
  createCandidate,
  getCandidateProfile,
  getCandidateById,
  listCandidates,
  parseResumeAndCreateCandidate,
  rankCandidatesForJob,
  semanticSearchCandidates,
  updateCandidate
} from "../services/candidate.service.js";
import { extractTextFromFile } from "../utils/file-text.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listCandidates(request.query);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const candidate = await getCandidateById(request.params.candidateId);
  response.status(200).json({ candidate });
});

export const getProfile = asyncHandler(async (request, response) => {
  const profile = await getCandidateProfile(request.params.candidateId);
  response.status(200).json(profile);
});

export const create = asyncHandler(async (request, response) => {
  const candidate = await createCandidate(request.validatedBody, request.user.id);
  response.status(201).json({ candidate });
});

export const update = asyncHandler(async (request, response) => {
  const candidate = await updateCandidate(
    request.params.candidateId,
    request.validatedBody
  );
  response.status(200).json({ candidate });
});

export const uploadResume = asyncHandler(async (request, response) => {
  const resumeText = await extractTextFromFile(request.file);
  const result = await parseResumeAndCreateCandidate({
    actorId: request.user.id,
    resumeText,
    targetRole: request.body.targetRole || "",
    companyContext: request.body.companyContext || "",
    jobId: request.body.jobId || ""
  });

  response.status(201).json(result);
});

export const semanticSearch = asyncHandler(async (request, response) => {
  const result = await semanticSearchCandidates(request.query);
  response.status(200).json(result);
});

export const rankForJob = asyncHandler(async (request, response) => {
  const result = await rankCandidatesForJob(request.params.jobId);
  response.status(200).json(result);
});
