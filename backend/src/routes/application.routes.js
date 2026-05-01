import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateApplication } from "../validators/domain.validator.js";

const router = Router();

// All authenticated roles can list and view (access-control filters by role in service)
router.get("/", applicationController.list);
router.get("/pipeline/board", applicationController.pipeline);
router.get("/:applicationId", applicationController.getById);

// Candidates can apply to jobs (authenticated apply)
router.post(
  "/apply",
  requireRole("candidate"),
  applicationController.applyAsCandidate
);

// Staff can create applications manually
router.post(
  "/",
  requireRole("admin", "recruiter"),
  validateWith(validateApplication),
  applicationController.create
);

// Stage/status updates: staff only
router.patch(
  "/:applicationId",
  requireRole("admin", "recruiter"),
  validateWith((body) => validateApplication(body, { partial: true })),
  applicationController.update
);

export default router;
