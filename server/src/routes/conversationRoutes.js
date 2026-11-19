import express from "express";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { idParamValidator } from "../validators/commonValidators.js";
import { createConversation } from "../controllers/conversationController.js";

const router = express.Router();

// Create Conversation
router.post(
  "/:id",
  protect,
  validate(idParamValidator, "params"),
  createConversation,
);

export default router;
