import express from "express";
import authController from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import { registerValidator } from "../validators/authValidators.js";

const router = express.Router();

// Register
router.post("/register", validate(registerValidator), authController.register);

export default router;
