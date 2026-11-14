import express from "express";
import presignUploads from "../controllers/uploadController.js";
import validate from "../middleware/validate.js";
import protect from "../middleware/protect.js";
import { presignValidator } from "../validators/uploadValidator.js";

const router = express.Router();

router.post("/presign", protect, validate(presignValidator), presignUploads);

export default router;
