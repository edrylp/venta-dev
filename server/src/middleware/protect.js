import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RevokedToken from "../models/RevokedToken.js";

const unauthorized = (res, message) =>
  res.status(401).json({ success: false, message });

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(res, "Not authorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });

    if (!decoded.jti) {
        return unauthorized(res, "Invalid or expired token. Please log in again.")
    }

    const revoked = await RevokedToken.findOne({ jti: decoded.jti })
      .select("_id")
      .lean();
    if (revoked) {
        return unauthorized(res, "This token has been revoked. Please log in again.");
    }

    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (!user) {
        return unauthorized(res, "User belonging to this token no longer exists.");
    }

    if (user.changedPasswordAfter(decoded.iat)) {
        return unauthorized(res, "Password recently changed. Please log in again.");
    }

    req.auth = decoded;
    req.user = user;
    next();
  } catch (error) {
    return unauthorized(res, "Invalid or expired token. Please login again.");
  }
};

export default protect;
