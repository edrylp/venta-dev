import express from "express";
import { register, login, changePassword, logout } from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import protect from "../middleware/protect.js";
import { registerValidator, loginValidator, changePasswordValidator } from "../validators/authValidators.js";

const router = express.Router();

// Register
router.post("/register", validate(registerValidator), register);

// Login
router.post("/login", validate(loginValidator), login);

// Change Password
router.patch("/password", protect, validate(changePasswordValidator), changePassword);

// Logout
router.post("/logout", protect, logout);

export default router;
