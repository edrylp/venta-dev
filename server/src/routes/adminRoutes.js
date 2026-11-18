import express from "express";
import { getPendingListings } from "../controllers/listingController.js";
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

// Review pending listings
router.get("/listings", protect, authorize("admin"), getPendingListings);

export default router;
