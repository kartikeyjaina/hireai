import { Router } from "express";
import * as jobController from "../controllers/job.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateJob } from "../validators/domain.validator.js";
import { validateJobDescriptionRequest } from "../validators/ai.validator.js";

const router = Router();

router.get("/", jobController.list);
router.get("/:jobId", jobController.getById);
router.post(
  "/generate-description",
  requireRole("admin", "recruiter"),
  validateWith(validateJobDescriptionRequest),
  jobController.generateDescription
);
router.post("/", requireRole("admin", "recruiter"), validateWith(validateJob), jobController.create);
router.patch(
  "/:jobId",
  requireRole("admin", "recruiter"),
  validateWith((body) => validateJob(body, { partial: true })),
  jobController.update
);

export default router;
