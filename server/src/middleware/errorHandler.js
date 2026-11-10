import { errors } from "@vinejs/vine";

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // VineJS validation errors
  if (err instanceof errors.E_VALIDATION_ERROR) {
    return res
      .status(400)
      .json({ success: false, message: err.messages[0].message });
  }

  // invalid token
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  // expired token
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // duplicate
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "Value";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  // validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  // invalid ObjectId
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  // Log server-side errors
  if (statusCode >= 500) {
    console.error(err);
  }

  // internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;