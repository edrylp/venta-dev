import Listing from "../models/Listing.js";

const createListing = async (req, res, next) => {
  try {
    const { category, title, price, description, location, images } =
      req.validated.body;

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

export default { 
    createListing 
};
