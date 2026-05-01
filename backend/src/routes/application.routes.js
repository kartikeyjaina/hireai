import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateApplication } from "../validators/domain.validator.js";

const router = Router();

router.get("/", applicationController.list);
router.get("/pipeline/board", applicationController.pipeline);
router.get("/:applicationId", applicationController.getById);
router.post(
  "/",
  requireRole("admin", "recruiter"),
  validateWith(validateApplication),
  applicationController.create
);
router.patch(
  "/:applicationId",
  requireRole("admin", "recruiter"),
  validateWith((body) => validateApplication(body, { partial: true })),
  applicationController.update
);

export default router;
