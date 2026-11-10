import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import "../src/config/vine.js";
import validate from "../src/middleware/validate.js";
import { loginValidator, registerValidator } from "../src/validators/authValidators.js";
import errorHandler from "../src/middleware/errorHandler.js"; 

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