import asyncHandler from "../utils/async-handler.js";
import {
  createInterview,
  getInterviewById,
  listInterviews,
  updateInterview
} from "../services/interview.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listInterviews(request.query, request.user);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const interview = await getInterviewById(request.params.interviewId, request.user);
  response.status(200).json({ interview });
});

export const create = asyncHandler(async (request, response) => {
  const interview = await createInterview(request.validatedBody, request.user);
  response.status(201).json({ interview });
});

export const update = asyncHandler(async (request, response) => {
  const interview = await updateInterview(
    request.params.interviewId,
    request.validatedBody,
    request.user
  );
  response.status(200).json({ interview });
});
