import express from "express";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { conversationIdParamValidator } from "../validators/commonValidators.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { sendMessageValidator } from "../validators/messageValidator.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

// Send a Message
router.post(
  "/",
  validate(conversationIdParamValidator, "params"),
  validate(sendMessageValidator),
  sendMessage,
);

// Get Messages
router.get(
  "/",
  validate(conversationIdParamValidator, "params"),
  getMessages,
);

export default router;
