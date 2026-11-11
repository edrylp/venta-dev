import jwt from "jsonwebtoken";

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

    req.auth = decoded;
    next();
  } catch (error) {
    return unauthorized(res, "Invalid or expired token. Please login again.");
  }
};

export default protect;
