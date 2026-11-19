import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Listing from "../models/Listing.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.validated.body;
    const conversationId = req.validated.params.conversationId;
    const senderId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    const isParticipant =
      conversation &&
      (senderId.equals(conversation.buyerId) ||
        senderId.equals(conversation.sellerId));

    if (!isParticipant) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const listing = await Listing.findById(conversation.listingId);

    if (!listing || listing.status !== "available") {
        return res.status(409).json({
            success: false,
            message: "This listing is no longer available for messaging",
        });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    next(err);
  }
};
