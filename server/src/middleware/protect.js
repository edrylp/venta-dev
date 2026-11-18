import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RevokedToken from "../models/RevokedToken.js";

const fail = (message) => ({ ok: false, message });

const authenticate = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return fail("Not authorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return fail("Invalid or expired token. Please log in again.")
    }
    throw err; // This is to pass non-JWT errors to the main catch block
  }

  if (!decoded.jti) {
    return fail("Invalid or expired token. Please log in again.");
  }

  const revoked = await RevokedToken.findOne({ jti: decoded.jti })
    .select("_id")
    .lean();

  if (revoked) {
    return fail("This token has been revoked. Please log in again.");
  }

  const user = await User.findById(decoded.id).select("+passwordChangedAt");
  if (!user) {
    return fail(
      "User belonging to this token no longer exists."
    );
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return fail("Password recently changed. Please log in again.");
  }

  return { ok: true, user, decoded };
};

export const protect = async (req, res, next) => {
  try {
    const result = await authenticate(req);
    if (!result.ok) {
      return res.status(401).json({success: false, message: result.message });
    } 
    req.auth = result.decoded;
    req.user = result.user;
    next();
  } catch (err) {
    next(err);
  }
}
  
export const optionalAuth = async (req, res, next) => {
  try {
    const result = await authenticate(req);
    if (result.ok) {
      req.auth = result.decoded;
      req.user = result.user;
    } 
    next();
  } catch (err) {
    next(err);
  }
}

export default protect;
