import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateNotification } from "../validators/domain.validator.js";

const router = Router();

router.get("/", notificationController.list);
router.patch("/read-all", notificationController.markAllRead);
router.post(
  "/",
  requireRole("admin", "recruiter"),
  validateWith(validateNotification),
  notificationController.create
);
router.patch("/:notificationId/read", notificationController.markRead);

export default router;
