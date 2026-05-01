import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/app-error.js";

const SALT_ROUNDS = 12;

function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return { secret, expiresIn };
}

function signAccessToken(user) {
  const { secret, expiresIn } = getJwtConfig();

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    secret,
    {
      expiresIn
    }
  );
}

export async function registerUser(payload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  const user = await User.create({
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: payload.role
  });

  return {
    token: signAccessToken(user),
    user: user.toSafeObject()
  };
}

export async function loginUser(payload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated", 403);
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAccessToken(user),
    user: user.toSafeObject()
  };
}

export async function getAuthenticatedUser(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User account is unavailable", 404);
  }

  return user.toSafeObject();
}
