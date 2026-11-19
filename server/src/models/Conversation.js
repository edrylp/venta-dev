import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      trim: true,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// One conversation per buyer per listing
conversationSchema.index({ buyerId: 1, listingId: 1 }, { unique: true });

// Seller inbox, newest activity first
conversationSchema.index({ sellerId: 1, lastMessageAt: -1 });

// Buyer inbox, newest activity first
conversationSchema.index({ buyerId: 1, lastMessageAt: -1 });

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
