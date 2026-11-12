import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../src/config/database.js";
import User from "../src/models/User.js";

const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

const seedAdmin = async () => {
  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "Populate ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env",
    );
  }

  await connectDatabase();

  const email = ADMIN_EMAIL.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log(
      existingUser.role === "admin"
        ? "An admin account with this email already exists. Nothing created."
        : `A user with this email exists and has a role of "${existingUser.role}". Nothing created.`,
    );
    return;
  }

  try {
    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    console.log("Admin created!");
  } catch (err) {
    if (err.code === 11000) {
      console.log("Username or email already taken. Nothing created.");
      return;
    }
    throw err;
  }
};

seedAdmin()
  .catch((err) => {
    console.error("Seed failed: ", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
