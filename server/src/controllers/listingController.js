import Listing from "../models/Listing.js";
import { hasValidUserKeys } from "../utils/s3.js";

export const createListing = async (req, res, next) => {
  try {
    const { category, title, price, description, location, images } =
      req.validated.body;

    if (!hasValidUserKeys(req.user._id, images)) {
        return res.status(400).json({
            success: false,
            message: "Invalid image keys"
        });
    }

    const newListing = await Listing.create({
      userId: req.user._id,
      category,
      title,
      price,
      description,
      location,
      images,
    });

    return res.status(201).json({
      success: true,
      data: newListing,
    });
  } catch (err) {
    next(err);
  }
};
