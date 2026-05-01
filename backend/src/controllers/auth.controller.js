import { getAuthenticatedUser, loginUser, registerUser } from "../services/auth.service.js";
import asyncHandler from "../utils/async-handler.js";

export const signup = asyncHandler(async (request, response) => {
  const result = await registerUser(request.validatedBody);

  response.status(201).json(result);
});

export const login = asyncHandler(async (request, response) => {
  const result = await loginUser(request.validatedBody);

  response.status(200).json(result);
});

export const me = asyncHandler(async (request, response) => {
  const user = await getAuthenticatedUser(request.user.id);

  response.status(200).json({ user });
});
