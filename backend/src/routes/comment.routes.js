import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import validateWith from "../middleware/validate.middleware.js";
import { validateComment } from "../validators/domain.validator.js";

const router = Router();

router.get("/", commentController.list);
router.get("/:commentId", commentController.getById);
router.post("/", validateWith(validateComment), commentController.create);
router.patch(
  "/:commentId",
  validateWith((body) => validateComment(body, { partial: true })),
  commentController.update
);

export default router;
