import asyncHandler from "../utils/async-handler.js";
import { createJob, getJobById, listJobs, updateJob } from "../services/job.service.js";
import { generateJobDescription } from "../services/ai.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listJobs(request.query, request.user);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const job = await getJobById(request.params.jobId, request.user);
  response.status(200).json({ job });
});

export const create = asyncHandler(async (request, response) => {
  const job = await createJob(request.validatedBody, request.user.id);
  response.status(201).json({ job });
});

export const update = asyncHandler(async (request, response) => {
  const job = await updateJob(request.params.jobId, request.validatedBody, request.user);
  response.status(200).json({ job });
});

export const generateDescription = asyncHandler(async (request, response) => {
  const result = await generateJobDescription(request.validatedBody);
  response.status(200).json({ result });
});
