import asyncHandler from "../utils/async-handler.js";
import {
  deactivateUser,
  getUserDirectory,
  getUserById,
  listUsers,
  updateUser
} from "../services/user.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listUsers(request.query);
  response.status(200).json(result);
});

export const getById = asyncHandler(async (request, response) => {
  const user = await getUserById(request.params.userId);
  response.status(200).json({ user: user.toSafeObject() });
});

export const directory = asyncHandler(async (request, response) => {
  const result = await getUserDirectory(request.query);
  response.status(200).json(result);
});

export const update = asyncHandler(async (request, response) => {
  const user = await updateUser(request.params.userId, request.validatedBody);
  response.status(200).json({ user });
});

export const deactivate = asyncHandler(async (request, response) => {
  const user = await deactivateUser(request.params.userId);
  response.status(200).json({ user });
});
