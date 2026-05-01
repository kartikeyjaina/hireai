import { Router } from "express";
import * as candidateController from "../controllers/candidate.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { resumeUploadRateLimit } from "../middleware/rate-limit.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateCandidate } from "../validators/domain.validator.js";

const router = Router();

router.get("/", candidateController.list);
router.get("/semantic-search/query", candidateController.semanticSearch);
router.get("/ranking/job/:jobId", requireRole("admin", "recruiter"), candidateController.rankForJob);
router.get("/:candidateId/profile", candidateController.getProfile);
router.get("/:candidateId", candidateController.getById);
router.post(
  "/upload-resume",
  requireRole("admin", "recruiter"),
  resumeUploadRateLimit,
  uploadResume,
  candidateController.uploadResume
);
router.post(
  "/",
  requireRole("admin", "recruiter"),
  validateWith(validateCandidate),
  candidateController.create
);
router.patch(
  "/:candidateId",
  requireRole("admin", "recruiter"),
  validateWith((body) => validateCandidate(body, { partial: true })),
  candidateController.update
);

export default router;
