import asyncHandler from "../utils/async-handler.js";
import {
  createComment,
  getCommentById,
  listComments,
  updateComment
} from "../services/comment.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listComments(request.query);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const comment = await getCommentById(request.params.commentId);
  response.status(200).json({ comment });
});

export const create = asyncHandler(async (request, response) => {
  const comment = await createComment(request.validatedBody, request.user.id);
  response.status(201).json({ comment });
});

export const update = asyncHandler(async (request, response) => {
  const comment = await updateComment(
    request.params.commentId,
    request.validatedBody,
    request.user.id
  );
  response.status(200).json({ comment });
});
