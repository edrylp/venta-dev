import express from "express";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import {
  listingIdParamValidator,
  conversationIdParamValidator,
} from "../validators/commonValidators.js";
import {
  createConversation,
  getConversations,
  getConversation,
} from "../controllers/conversationController.js";
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

// Get Conversation
router.get(
  "/:conversationId",
  validate(conversationIdParamValidator, "params"),
  getConversation,
);

router.use("/:conversationId/messages", messageRoutes);

export default router;
