import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import Conversation from "../models/Conversation.js";

export const createConversation = async (req, res, next) => {
  try {
    const listingId = req.validated.params.listingId;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const buyerId = req.user._id;
    const sellerId = listing.userId;

    if (buyerId.equals(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "You can't message your own listing",
      });
    }

    const existingConversation = await Conversation.findOne({
      buyerId,
      listingId,
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        data: existingConversation,
      });
    }

    if (listing.status !== "available") {
      return res.status(409).json({
        success: false,
        message: "Listing not available",
      });
    }

    try {
      const newConversation = await Conversation.create({
        listingId,
        buyerId,
        sellerId,
      });

      return res.status(201).json({
        success: true,
        data: newConversation,
      });
    } catch (err) {
      if (err.code === 11000) {
        const winner = await Conversation.findOne({ buyerId, listingId });
        return res.status(200).json({ success: true, data: winner });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
      lastMessageAt: mongoose.trusted({ $ne: null }), // this is to hide conversations with no messages yet
    })
      .sort({ lastMessageAt: -1, _id: -1 })
      .populate("listingId", "title status")
      .populate("buyerId sellerId", "username")
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversationId = req.validated.params.conversationId;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("listingId", "title status price")
      .populate("buyerId sellerId", "username")
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
};
