import mongoose from "mongoose";
import { publicUrl, MAX_FILES } from "../utils/s3.js";

export const CATEGORIES = [
  "Desktop",
  "Processor",
  "GPU",
  "Motherboard",
  "RAM",
  "Storage",
  "PSU",
  "Cooler",
  "Case",
];

const listingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: CATEGORIES,
    },
    title: {
      type: String,
      required: [true, "Listing title is required"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"],
    },
    description: {
      type: String,
      required: [true, "Listing description is required"],
      minlength: [10, "Listing description is too short"],
      maxlength: [4000, "Listing description cannot exceed 4000 characters"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      maxlength: [100, "Location cannot exceed 100 characters"],
      trim: true,
    },
    // S3 object keys, not URLs. URLs are built by the imageUrls virtual.
    images: {
      type: [String],
      validate: [
        (files) => files.length >= 1 && files.length <= MAX_FILES,
        `A listing needs 1 to ${MAX_FILES} photos`,
      ],
    },
    status: {
      type: String,
      enum: ["pending", "available", "rejected", "sold"],
      default: "pending",
    },
    // Required when an admin rejects (checked in the controller); cleared when the seller resubmits
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, id: false },
);

// Seller's listings, newest first
listingSchema.index({ userId: 1, createdAt: -1 });

// Public listings, newest first (default view)
listingSchema.index({ status: 1, createdAt: -1 });

// Public listings, sorted by price
listingSchema.index({ status: 1, price: 1 });

// Public listings, category browsing sorted by price (low-to-high)
listingSchema.index({ category: 1, status: 1, price: 1 });

// Public listings, category browsing sorted by newest listings first
listingSchema.index({ category: 1, status: 1, createdAt: -1 });

// Keyword search
listingSchema.index({ title: "text", description: "text" });

listingSchema.virtual("imageUrls").get(function () {
  return (this.images ?? []).map(publicUrl);
});

export default mongoose.models.Listing ||
  mongoose.model("Listing", listingSchema);
