import "../config/vine.js";
import vine from "@vinejs/vine";
import { CATEGORIES } from "../models/Listing.js";
import { MAX_FILES } from "../utils/s3.js";

export const createListingValidator = vine.create({
  category: vine.enum(CATEGORIES),
  title: vine.string().trim().minLength(1).maxLength(100),
  price: vine.number().min(1).decimal([0, 2]),
  description: vine.string().trim().minLength(10).maxLength(4000),
  location: vine.string().trim().minLength(1).maxLength(100),
  images: vine
    .array(vine.string().trim())
    .minLength(1)
    .maxLength(MAX_FILES)
    .distinct(),
});

export const updateListingValidator = vine.create({
  category: vine.enum(CATEGORIES).optional(),
  title: vine.string().trim().minLength(1).maxLength(100).optional(),
  price: vine.number().min(1).decimal([0, 2]).optional(),
  description: vine.string().trim().minLength(10).maxLength(4000).optional(),
  location: vine.string().trim().minLength(1).maxLength(100).optional(),
  images: vine
    .array(vine.string().trim())
    .minLength(1)
    .maxLength(MAX_FILES)
    .distinct()
    .optional(),
});

export const adminStatusValidator = vine.create({
  status: vine.enum(["available", "rejected"]),
  rejectionReason: vine
    .string()
    .trim()
    .minLength(5)
    .maxLength(500)
    .optional()
    .requiredWhen("status", "=", "rejected"),
});

export const listingQueryValidator = vine.create({
  category: vine.enum(CATEGORIES).optional(),
  q: vine.string().trim().minLength(1).maxLength(100).optional(),
  sort: vine.enum(["newest", "price_asc", "price_desc"]).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
  limit: vine.number().withoutDecimals().min(1).max(50).optional(),
});