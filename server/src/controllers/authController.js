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

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password"
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
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

const logout = async (req, res, next) => {
  try {
    const { jti, exp } = req.auth ?? {};

    await RevokedToken.create({
      jti,
      expiresAt: new Date(exp * 1000),
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  changePassword,
  logout,
};