import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateUserUpdate } from "../validators/domain.validator.js";

const router = Router();

router.get("/directory", userController.directory);
router.get("/", requireRole("admin"), userController.list);
router.get("/:userId", requireRole("admin"), userController.getById);
router.patch(
  "/:userId",
  requireRole("admin"),
  validateWith(validateUserUpdate),
  userController.update
);
router.patch("/:userId/deactivate", requireRole("admin"), userController.deactivate);

export default router;
