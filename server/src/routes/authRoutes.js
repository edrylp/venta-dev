import express from "express";
import authController from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import protect from "../middleware/protect.js";
import { registerValidator, loginValidator, changePasswordValidator } from "../validators/authValidators.js";

const router = express.Router();

// Register
router.post("/register", validate(registerValidator), authController.register);

// Login
router.post("/login", validate(loginValidator), authController.login);

// Change Password
router.patch("/password", protect, validate(changePasswordValidator), authController.changePassword);

// Logout
router.post("/logout", protect, authController.logout);

export default router;
