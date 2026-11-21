import request from "supertest";
import { expect } from "vitest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Listing from "../src/models/Listing.js";

export const PASSWORD = "ventauser2026";
let counter = 0;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const bearer = (token) => `Bearer ${token}`;

export const uniqueUser = () => {
  const username = `user_${++counter}_${Math.random().toString(36).slice(2, 6)}`;
  return { username, email: `${username}@venta.com`, password: PASSWORD };
};

export const registerUser = async () => {
  const creds = uniqueUser();
  const res = await request(app).post("/api/auth/register").send(creds);
  expect(res.status).toBe(201);
  return { ...creds, id: res.body.data.user._id, token: res.body.data.token };
};

export const makeAdmin = async () => {
  const creds = uniqueUser();
  const admin = await User.create({ ...creds, role: "admin" });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: creds.email, password: creds.password });
  expect(res.status).toBe(200);
  return { ...creds, id: admin._id.toString(), token: res.body.data.token };
};

// Inserts directly so any status can be created without walking the API.
// Fake S3 keys under the owner's prefix; nothing is uploaded.
export const createListing = (ownerId, overrides = {}) =>
  Listing.create({
    userId: ownerId,
    category: "GPU",
    title: "RTX 3060 12GB",
    price: 15000,
    description: "Used for one year, works fine.",
    location: "Angat, Bulacan",
    images: [`listings/${ownerId}/test.jpg`],
    status: "available",
    ...overrides,
  });
