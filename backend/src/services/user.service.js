import User from "../models/user.model.js";
import AppError from "../utils/app-error.js";
import { parsePagination } from "../utils/validation.js";
import { toObjectId } from "../utils/object-id.js";

export async function listUsers(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    items: items.map((item) => item.toSafeObject()),
    pagination: { page, limit, total }
  };
}

export async function getUserDirectory(query) {
  const filter = {
    isActive: true
  };

  if (query.search) {
    const pattern = String(query.search).trim();
    filter.$or = [
      { firstName: { $regex: pattern, $options: "i" } },
      { lastName: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } }
    ];
  }

  const users = await User.find(filter)
    .select("firstName lastName email role")
    .sort({ firstName: 1, lastName: 1 })
    .limit(50);

  return {
    items: users.map((user) => user.toSafeObject())
  };
}

export async function getUserById(userId) {
  const user = await User.findById(toObjectId(userId, "userId"));

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function updateUser(userId, payload) {
  const user = await getUserById(userId);

  Object.assign(user, payload);
  await user.save();

  return user.toSafeObject();
}

export async function deactivateUser(userId) {
  const user = await getUserById(userId);
  user.isActive = false;
  await user.save();
  return user.toSafeObject();
}
