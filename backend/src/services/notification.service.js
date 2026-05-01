import Notification from "../models/notification.model.js";
import AppError from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import { parsePagination } from "../utils/validation.js";

const NOTIFICATION_POPULATE = [
  { path: "recipient", select: "firstName lastName email role" }
];

export async function listNotifications(query, actorId) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    recipient: toObjectId(actorId, "actorId")
  };

  if (query.unreadOnly === "true") {
    filter.readAt = null;
  }

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate(NOTIFICATION_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter)
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function getNotificationById(notificationId, actorId) {
  const notification = await Notification.findOne({
    _id: toObjectId(notificationId, "notificationId"),
    recipient: toObjectId(actorId, "actorId")
  }).populate(NOTIFICATION_POPULATE);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
}

export async function createNotification(payload) {
  const notification = await Notification.create({
    ...payload,
    recipient: toObjectId(payload.recipient, "recipient")
  });

  return notification;
}

export async function createNotifications(payloads) {
  if (!Array.isArray(payloads) || !payloads.length) {
    return [];
  }

  const documents = payloads.map((payload) => ({
    ...payload,
    recipient: toObjectId(payload.recipient, "recipient")
  }));

  return Notification.insertMany(documents);
}

export async function markNotificationRead(notificationId, actorId) {
  const notification = await getNotificationById(notificationId, actorId);
  notification.readAt = notification.readAt || new Date();
  await notification.save();
  return notification;
}

export async function markAllNotificationsRead(actorId) {
  await Notification.updateMany(
    {
      recipient: toObjectId(actorId, "actorId"),
      readAt: null
    },
    {
      $set: {
        readAt: new Date()
      }
    }
  );

  return listNotifications({}, actorId);
}
