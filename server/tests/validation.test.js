import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import "../src/config/vine.js";
import validate from "../src/middleware/validate.js";
import { loginValidator, registerValidator } from "../src/validators/authValidators.js";
import errorHandler from "../src/middleware/errorHandler.js"; 
import {
  createListingValidator,
  updateListingValidator,
  adminStatusValidator,
  listingQueryValidator,
} from "../src/validators/listingValidators.js";
import { idParamValidator } from "../src/validators/commonValidators.js";

const app = express();
app.use(express.json());
app.post("/test/login", validate(loginValidator), (_req, res) => res.json({ success: true }));
app.post("/test/register", validate(registerValidator), (_req, res) => res.json({ success: true }));
app.use(errorHandler);

describe("done-when criteria", () => {
  it("rejects non-string input such as { $gt: '' } with 400", async () => {
    const res = await request(app)
      .post("/test/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });

    expect(res.status).toBe(400);
  });

  it("uses the standard error shape", async () => {
    const res = await request(app).post("/test/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe("string");
    expect(Object.keys(res.body).sort()).toEqual(["message", "success"]);
  });

  it("lets valid input through", async () => {
    const res = await request(app)
      .post("/test/login")
      .send({ email: "a@b.com", password: "whatever" });

    expect(res.status).toBe(200);
  });
});

describe("register validator", () => {
  const valid = { username: "edryl_p", email: "a@b.com", password: "12345678" };

  it("accepts a valid body", async () => {
    const res = await request(app).post("/test/register").send(valid);
    expect(res.status).toBe(200);
  });

  it("rejects a username shorter than 4 characters with the custom message", async () => {
    const res = await request(app).post("/test/register").send({ ...valid, username: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Username must be at least 4 characters");
  });

  it("rejects a username with invalid characters", async () => {
    const res = await request(app).post("/test/register").send({ ...valid, username: "bad-name!" });
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app).post("/test/register").send({ ...valid, password: "1234567" });
    expect(res.status).toBe(400);
  });
});

// Listing Validation
const validListing = {
  category: "GPU",
  title: "RTX 3060 12GB",
  price: 15000,
  description: "Used for one year, works perfectly.",
  location: "Angat, Bulacan",
  images: ["listings/user1/a.jpg"],
};

describe("createListingValidator", () => {
  it("accepts a valid body", async () => {
    await expect(
      createListingValidator.validate(validListing),
    ).resolves.toBeDefined();
  });

  it.each([
    ["invalid category", { category: "Laptop" }],
    ["price under 1", { price: 0 }],
    ["short description", { description: "too short" }],
    ["0 images", { images: [] }],
    [
      "11 images",
      { images: Array.from({ length: 11 }, (_, i) => `listings/u/${i}.jpg`) },
    ],
    ["duplicate keys", { images: ["listings/u/a.jpg", "listings/u/a.jpg"] }],
  ])("rejects %s", async (_name, override) => {
    await expect(
      createListingValidator.validate({ ...validListing, ...override }),
    ).rejects.toThrow();
  });

  it("drops unknown fields", async () => {
    const out = await createListingValidator.validate({
      ...validListing,
      status: "available",
      userId: "someone-else",
      rejectionReason: "listing photos not related to title and description",
    });
    expect(out.status).toBeUndefined();
    expect(out.userId).toBeUndefined();
    expect(out.rejectionReason).toBeUndefined();
  });
});

describe("listListingsValidator", () => {
  it("rejects non-string category and q", async () => {
    await expect(listingQueryValidator.validate({ category: { $ne: "GPU" } })).rejects.toThrow();
    await expect(listingQueryValidator.validate({ q: ["a", "b"] })).rejects.toThrow();
  });

  it("rejects limit over 50 and page under 1", async () => {
    await expect(listingQueryValidator.validate({ limit: 51 })).rejects.toThrow();
    await expect(listingQueryValidator.validate({ page: 0 })).rejects.toThrow();
  });

  it("converts numeric strings", async () => {
    const out = await listingQueryValidator.validate({ page: "2", limit: "10" });
    expect(out).toMatchObject({ page: 2, limit: 10 });
  });
});

describe("idParamValidator", () => {
  it("rejects an invalid ObjectId", async () => {
    await expect(idParamValidator.validate({ id: "not-an-id" })).rejects.toThrow();
  });
});

describe("updateListingValidator", () => {
  it("accepts a partial body and drops status", async () => {
    const out = await updateListingValidator.validate({ title: "New title", status: "available" });
    expect(out.title).toBe("New title");
    expect(out.status).toBeUndefined();
  });
});

describe("adminStatusValidator", () => {
  it("requires a reason when rejecting", async () => {
    await expect(adminStatusValidator.validate({ status: "rejected" })).rejects.toThrow();
    await expect(
      adminStatusValidator.validate({ status: "rejected", rejectionReason: "Blurry photos" }),
    ).resolves.toBeDefined();
  });

  it("does not require a reason when approving", async () => {
    await expect(adminStatusValidator.validate({ status: "available" })).resolves.toBeDefined();
  });
});