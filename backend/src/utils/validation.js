import AppError from "./app-error.js";

export function isNonEmptyString(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

export function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit || "20", 10) || 20, 1),
    50,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function assertEnum(value, allowedValues, message) {
  if (!allowedValues.includes(value)) {
    throw new AppError(message, 422);
  }
}
