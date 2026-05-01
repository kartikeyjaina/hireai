import Comment from "../models/comment.model.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";
import AppError from "../utils/app-error.js";
import { createNotifications } from "./notification.service.js";

const COMMENT_POPULATE = [
  { path: "author", select: "firstName lastName email role" },
  { path: "mentions", select: "firstName lastName email role" }
];

export async function listComments(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.subjectType) {
    filter.subjectType = query.subjectType;
  }

  if (query.subjectId) {
    filter.subjectId = toObjectId(query.subjectId, "subjectId");
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .populate(COMMENT_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getCommentById(commentId) {
  const comment = await Comment.findById(toObjectId(commentId, "commentId")).populate(
    COMMENT_POPULATE
  );

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  return comment;
}

export async function createComment(payload, actorId) {
  const comment = await Comment.create({
    ...payload,
    author: toObjectId(actorId, "actorId"),
    subjectId: toObjectId(payload.subjectId, "subjectId"),
    mentions: (payload.mentions || []).map((id) => toObjectId(id, "mention"))
  });

  await createNotifications(
    (payload.mentions || [])
      .filter((id) => id !== actorId)
      .map((recipient) => ({
        recipient,
        type: "mention",
        title: "You were mentioned in a comment",
        message: payload.body.slice(0, 180),
        link: `/${payload.subjectType}s/${payload.subjectId}`,
        metadata: {
          subjectType: payload.subjectType,
          subjectId: payload.subjectId,
          commentId: comment._id.toString()
        }
      }))
  );

  return getCommentById(comment._id.toString());
}

export async function updateComment(commentId, payload, actorId) {
  const comment = await getCommentById(commentId);

  if (comment.author._id.toString() !== actorId) {
    throw new AppError("Only the author can edit this comment", 403);
  }

  comment.body = payload.body;
  comment.mentions = (payload.mentions || []).map((id) => toObjectId(id, "mention"));
  await comment.save();

  await createNotifications(
    (payload.mentions || [])
      .filter((id) => id !== actorId)
      .map((recipient) => ({
        recipient,
        type: "mention",
        title: "You were mentioned in an updated comment",
        message: payload.body.slice(0, 180),
        link: `/${comment.subjectType}s/${comment.subjectId.toString()}`,
        metadata: {
          subjectType: comment.subjectType,
          subjectId: comment.subjectId.toString(),
          commentId: comment._id.toString()
        }
      }))
  );

  return getCommentById(comment._id.toString());
}
