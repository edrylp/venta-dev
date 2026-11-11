import express from "express";
import authController from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import { registerValidator, loginValidator } from "../validators/authValidators.js";

const router = express.Router();

// Register
router.post("/register", validate(registerValidator), authController.register);

// Login
router.post("/login", validate(loginValidator), authController.login);

export default router;
