import express from "express";
import publicController from "../controllers/public.controller.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validatePublicApplication } from "../validators/domain.validator.js";

const router = express.Router();

router.get("/jobs", publicController.listJobs);
router.get("/jobs/:jobId", publicController.getJob);
router.post("/apply", uploadResume, validateWith(validatePublicApplication), publicController.applyToJob);

export default router;
