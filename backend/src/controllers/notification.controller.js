import asyncHandler from "../utils/async-handler.js";
import {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notification.service.js";

export const list = asyncHandler(async (request, response) => {
  const result = await listNotifications(request.query, request.user.id);
  response.status(200).json(result);
});

export const create = asyncHandler(async (request, response) => {
  const notification = await createNotification(request.validatedBody);
  response.status(201).json({ notification });
});

export const markRead = asyncHandler(async (request, response) => {
  const notification = await markNotificationRead(
    request.params.notificationId,
    request.user.id
  );
  response.status(200).json({ notification });
});

export const markAllRead = asyncHandler(async (request, response) => {
  const result = await markAllNotificationsRead(request.user.id);
  response.status(200).json(result);
});
