import asyncHandler from "../utils/async-handler.js";
import {
  generateInterviewQuestions,
  generateJobDescription,
  parseResume,
  scoreCandidate
} from "../services/ai.service.js";
import { extractTextFromFile } from "../utils/file-text.js";

export const parseResumeFile = asyncHandler(async (request, response) => {
  const resumeText = await extractTextFromFile(request.file);
  const parsed = await parseResume({
    resumeText,
    targetRole: request.body.targetRole || "",
    companyContext: request.body.companyContext || ""
  });

  response.status(200).json({
    parsed,
    resumeText
  });
});

export const scoreCandidateFit = asyncHandler(async (request, response) => {
  const result = await scoreCandidate(request.validatedBody);
  response.status(200).json({ result });
});

export const createInterviewQuestions = asyncHandler(async (request, response) => {
  const result = await generateInterviewQuestions(request.validatedBody);
  response.status(200).json({ result });
});

export const createJobDescription = asyncHandler(async (request, response) => {
  const result = await generateJobDescription(request.validatedBody);
  response.status(200).json({ result });
});
