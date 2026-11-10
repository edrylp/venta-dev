import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    passwordChangedAt: {
        type: Date,
    },
    role: {
        type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);