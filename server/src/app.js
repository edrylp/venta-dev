import express from "express";
import helmet from "helmet";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import protect from "./middleware/protect.js";
import authorize from "./middleware/authorize.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// TEMPORARY!
app.get("/api/health/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: { _id: req.user._id, role: req.user.role }
  });
});

app.get("/api/health/admin", protect, authorize("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    data: { _id: req.user._id, role: req.user.role }
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler); 

export default app;