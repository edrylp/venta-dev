import express from "express";
import { createListing, getListings, getMyListings, getListingById } from "../controllers/listingController.js";
import { protect, optionalAuth } from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { createListingValidator, listingQueryValidator } from "../validators/listingValidators.js";
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

export default router;