import express from "express";
import listingController from "../controllers/listingController.js";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import { createListingValidator } from "../validators/listingValidators.js";

const router = express.Router();

// Create listing
router.post("/", protect, validate(createListingValidator), listingController.createListing);

export default router;