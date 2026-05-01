import mongoose from "mongoose";
import AppError from "./app-error.js";

export function toObjectId(value, fieldName = "id") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} is invalid`, 400);
  }

  return new mongoose.Types.ObjectId(value);
}
