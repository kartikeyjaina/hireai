import { Router } from "express";
import { login, me, signup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateLogin, validateSignup } from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", validateWith(validateSignup), signup);
router.post("/login", validateWith(validateLogin), login);
router.get("/me", requireAuth, me);

export default router;
