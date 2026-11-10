import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      minlength: [4, "Username must be at least 4 characters"],
      maxlength: [15, "Username cannot exceed 15 characters"],
      match: [
        /^[a-z0-9_]+$/,
        "Username may contain only lowercase letters, numbers, and underscores",
      ],
      unique: true,
      immutable: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
