import asyncHandler from "../utils/async-handler.js";
import {
  applyAsCandidate as applyAsCandidateService,
  createApplication,
  getApplicationById,
  getPipelineBoard,
  listApplications,
  updateApplication
} from "../services/application.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listApplications(request.query, request.user);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const application = await getApplicationById(request.params.applicationId, request.user);
  response.status(200).json({ application });
});

export const pipeline = asyncHandler(async (request, response) => {
  const board = await getPipelineBoard(request.query, request.user);
  response.status(200).json({ board });
});

export const create = asyncHandler(async (request, response) => {
  const application = await createApplication(request.validatedBody, request.user.id, request.user);
  response.status(201).json({ application });
});

export const update = asyncHandler(async (request, response) => {
  const application = await updateApplication(
    request.params.applicationId,
    request.validatedBody,
    request.user.id,
    request.user
  );
  response.status(200).json({ application });
});

export const applyAsCandidate = asyncHandler(async (request, response) => {
  const result = await applyAsCandidateService(request.body, request.user);
  response.status(201).json(result);
});
