import { Router } from "express";
import * as aiController from "../controllers/ai.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import {
  validateCandidateScoreRequest,
  validateInterviewQuestionRequest,
  validateJobDescriptionRequest
} from "../validators/ai.validator.js";

const router = Router();

router.post(
  "/parse-resume",
  requireRole("admin", "recruiter"),
  uploadResume,
  aiController.parseResumeFile
);
router.post(
  "/score-candidate",
  requireRole("admin", "recruiter"),
  validateWith(validateCandidateScoreRequest),
  aiController.scoreCandidateFit
);
router.post(
  "/generate-interview-questions",
  requireRole("admin", "recruiter", "interviewer"),
  validateWith(validateInterviewQuestionRequest),
  aiController.createInterviewQuestions
);
router.post(
  "/generate-job-description",
  requireRole("admin", "recruiter"),
  validateWith(validateJobDescriptionRequest),
  aiController.createJobDescription
);

export default router;
