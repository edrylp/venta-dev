import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { bearer, sleep, registerUser, makeAdmin } from "./helpers.js";

// Routes
const LOGIN_ROUTE = "/api/auth/login";
const PASSWORD_ROUTE = "/api/auth/password";
const LOGOUT_ROUTE = "/api/auth/logout";
const PROTECTED_ROUTE = "/api/listings/my-listings";
const ADMIN_ROUTE = "/api/admin/listings";

describe("Auth Routes", () => {
  it("register and login return tokens that work on the protected route", async () => {
    const user = await registerUser();

    const registered = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(user.token));
    expect(registered.status).toBe(200);

    const login = await request(app)
      .post(LOGIN_ROUTE)
      .send({ email: user.email, password: user.password });
    expect(login.status).toBe(200);

    const loggedIn = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(login.body.data.token));
    expect(loggedIn.status).toBe(200);
  });

  it("rejects the token after logout", async () => {
    const { token } = await registerUser();

    const before = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(token));
    expect(before.status).toBe(200);

    const logout = await request(app)
      .post(LOGOUT_ROUTE)
      .set("Authorization", bearer(token));
    expect(logout.status).toBe(200);

    const after = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(token));
    expect(after.status).toBe(401);
  });

  it("rejects the old token after a password change and accepts the new one", async () => {
    const user = await registerUser();
    const startToken = user.token;

    const before = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(startToken));
    expect(before.status).toBe(200);

    await sleep(2100);

    const change = await request(app)
      .patch(PASSWORD_ROUTE)
      .set("Authorization", bearer(startToken))
      .send({ currentPassword: user.password, newPassword: "newpassword2026"});
    expect(change.status).toBe(200);

    const freshToken = change.body.data.token;

    const oldCheck = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(startToken));
    expect(oldCheck.status).toBe(401);

    const freshCheck = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", bearer(freshToken));
    expect(freshCheck.status).toBe(200);
  });

  it("no token gives 401", async () => {
    const res = await request(app).get(PROTECTED_ROUTE);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the token is malformed", async () => {
    const res = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns 401 when the Authorization header is not a Bearer token", async () => {
    const res = await request(app)
      .get(PROTECTED_ROUTE)
      .set("Authorization", "abc123");
    expect(res.status).toBe(401);
  });

  // ADMIN Checks
  it("returns 403 for a normal user on the admin route", async () => {
    const { token } = await registerUser();

    const userCheck = await request(app)
      .get(ADMIN_ROUTE)
      .set("Authorization", bearer(token));
    expect(userCheck.status).toBe(403);
  });

  it("returns 200 for an admin user on the admin route", async () => {
    const { token } = await makeAdmin();

    const adminCheck = await request(app)
      .get(ADMIN_ROUTE)
      .set("Authorization", bearer(token));
    expect(adminCheck.status).toBe(200);
  });
});
