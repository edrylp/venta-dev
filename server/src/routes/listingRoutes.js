import express from "express";
import {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  editListing,
  deleteListing,
  markListingAsSold,
} from "../controllers/listingController.js";
import { protect, optionalAuth } from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import {
  createListingValidator,
  listingQueryValidator,
  updateListingValidator,
} from "../validators/listingValidators.js";
import { idParamValidator } from "../validators/commonValidators.js";

const router = express.Router();

// Create listing
router.post("/", protect, validate(createListingValidator), createListing);

// Browse available listings
router.get("/", validate(listingQueryValidator, "query",), getListings);

// Browse a specific seller's listings
router.get("/my-listings", protect, getMyListings);

// Browse a specific listing
router.get("/:id", optionalAuth, validate(idParamValidator, "params"), getListingById);

// Update a listing
router.patch(
  "/:id",
  protect,
  validate(idParamValidator, "params"),
  validate(updateListingValidator, "body"),
  editListing,
);

// Delete a listing
router.delete("/:id", protect, validate(idParamValidator, "params"), deleteListing);

// Mark a listing as sold
router.patch("/:id/sold", protect, validate(idParamValidator, "params"), markListingAsSold);

export default router;