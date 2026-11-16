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

export const getListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.validated.query;
    const skip = (page - 1) * limit;

    const filter = { status: "available" };
    if (category) {
      filter.category = category;
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("-description -rejectionReason"),
      Listing.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.validated.params.id).populate(
      "userId",
      "username",
    );

    const notFound = () =>
      res.status(404).json({ success: false, message: "Listing not found" });

    if (!listing) {
      return notFound();
    }

    if (listing.status !== "available") {
      const isOwner = req.user && listing.userId._id.equals(req.user._id);
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return notFound();
      }
    }

    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};
