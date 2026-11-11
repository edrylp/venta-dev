import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
      jwtid: randomUUID(),
    },
  );
};

export default generateToken;