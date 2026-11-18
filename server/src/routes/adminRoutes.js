import express from "express";
import { getPendingListings, reviewListing } from "../controllers/listingController.js";
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { idParamValidator } from "../validators/commonValidators.js";
import { adminStatusValidator } from "../validators/listingValidators.js";

const router = express.Router();

// Review pending listings
router.get("/listings", protect, authorize("admin"), getPendingListings);

// Approve or reject a listing
router.patch(
  "/listings/:id/status",
  protect,
  authorize("admin"),
  validate(idParamValidator, "params"),
  validate(adminStatusValidator),
  reviewListing,
);

export default router;
