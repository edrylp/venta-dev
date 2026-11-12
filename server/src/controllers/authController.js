import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import RevokedToken from "../models/RevokedToken.js";

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.validated.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(409).json({
        success: false,
        message: "Email already registered.",
        });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(409).json({
        success: false,
        message: "Username has already been taken.",
        });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id),
      }
    });

  } catch (error) {
    next(error);
  }
;}

export default {
  register,
  login,
};