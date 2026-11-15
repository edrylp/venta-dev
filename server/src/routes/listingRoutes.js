import express from "express";
import { createListing, getListings, getMyListings } from "../controllers/listingController.js";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { createListingValidator, listingQueryValidator } from "../validators/listingValidators.js";

const router = express.Router();

// Create listing
router.post("/", protect, validate(createListingValidator), createListing);

// Browse available listings
router.get("/", validate(listingQueryValidator, "query",), getListings);

// Browse a specific seller's listings
router.get("/my-listings", protect, getMyListings);

export default router;