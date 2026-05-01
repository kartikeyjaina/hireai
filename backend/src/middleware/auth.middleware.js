import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/async-handler.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return process.env.JWT_SECRET;
}

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication is required", 401);
  }

  let payload;

  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (_error) {
    throw new AppError("Authentication token is invalid or expired", 401);
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError("Authenticated user is unavailable", 401);
  }

  request.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email
  };

  next();
});

export function requireRole(...allowedRoles) {
  return function roleMiddleware(request, _response, next) {
    if (!request.user) {
      return next(new AppError("Authentication is required", 401));
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    return next();
  };
}
