import { Router } from "express";
import * as interviewController from "../controllers/interview.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateInterview } from "../validators/domain.validator.js";

const router = Router();

router.get("/", interviewController.list);
router.get("/:interviewId", interviewController.getById);
router.post(
  "/",
  requireRole("admin", "recruiter", "interviewer"),
  validateWith(validateInterview),
  interviewController.create
);
router.patch(
  "/:interviewId",
  requireRole("admin", "recruiter", "interviewer"),
  validateWith((body) => validateInterview(body, { partial: true })),
  interviewController.update
);

export default router;
