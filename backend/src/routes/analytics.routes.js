import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";

const router = Router();

router.get("/hiring", analyticsController.hiring);

export default router;
