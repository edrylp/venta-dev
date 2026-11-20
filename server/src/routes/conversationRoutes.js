import express from "express";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { listingIdParamValidator } from "../validators/commonValidators.js";
import { createConversation, getConversations } from "../controllers/conversationController.js";
import messageRoutes from "./messageRoutes.js";

const router = express.Router();
router.use(protect);

// Get Conversations
router.get("/", getConversations)

// Create Conversation
router.post(
  "/:listingId",
  validate(listingIdParamValidator, "params"),
  createConversation,
);

router.use("/:conversationId/messages", messageRoutes);

export default router;
