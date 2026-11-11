import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String },
  expiresAt: { type: Date },
});

export default mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);