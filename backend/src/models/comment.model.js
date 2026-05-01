import mongoose from "mongoose";
import { COMMENT_SUBJECT_TYPES } from "../utils/constants.js";

const commentSchema = new mongoose.Schema(
  {
    subjectType: {
      type: String,
      enum: COMMENT_SUBJECT_TYPES,
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    mentions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

commentSchema.index({ subjectType: 1, subjectId: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
