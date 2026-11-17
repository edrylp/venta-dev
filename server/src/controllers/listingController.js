import Listing from "../models/Listing.js";
import { hasValidUserKeys, deleteObjects } from "../utils/s3.js";

export const createListing = async (req, res, next) => {
  try {
    const { category, title, price, description, location, images } =
      req.validated.body;

    if (!hasValidUserKeys(req.user._id, images)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image keys",
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

export const editListing = async (req, res, next) => {
  try {
    const updates = req.validated.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const listing = await Listing.findById(req.validated.params.id);
    const isOwner = req.user && listing.userId.equals(req.user._id);

    if (!listing || !isOwner) {
      return res.status(404).json({ 
        success: false, 
        message: "Listing not found" 
      });
    }

    if (listing.status === "sold") {
      return res.status(409).json({ 
        success: false, 
        message: "A sold listing can't be updated" 
      });
    }

    let removedKeys = [];
    if (updates.images) {
      updates.images = [...new Set(updates.images)]; // drop duplicates
      if (!hasValidUserKeys(req.user._id, updates.images)) {
        return res.status(400).json({ success: false, message: "Invalid image keys" });
      }
      removedKeys = listing.images.filter((key) => !updates.images.includes(key));
    }

    Object.assign(listing, updates);
    if (listing.status !== "pending") {
      listing.status = "pending";
      listing.rejectionReason = null;
    }

    await listing.save();

    // Delete from S3 only after the save succeeds. A failure here leaves an orphan, not a broken listing.
    try { 
      await deleteObjects(removedKeys); 
    }  catch (err) { 
      console.error("S3 cleanup failed:", err); 
    }
    
    return res.status(200).json({
      success: true,
      data: listing,
    });

  } catch (err) {
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.validated.params.id);

    const isOwner = listing?.userId.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!listing || (!isOwner && !isAdmin)) {
      return res.status(404).json({ 
        success: false, 
        message: "Listing not found" 
      });
    }

    await listing.deleteOne();

    try { 
      await deleteObjects(listing.images); 
    }  catch (err) { 
      console.error("S3 cleanup failed:", err); 
    }
    
    return res.status(200).json({
      success: true,
      data: { message: "Successfully deleted"},
    });
  } catch (err) {
    next(err);
  }
}