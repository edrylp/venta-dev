import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import {
  bearer,
  sleep,
  registerUser,
  makeAdmin,
  createListing,
} from "./helpers.js";
import Listing from "../src/models/Listing.js";

vi.mock("../src/utils/s3.js", async (importOriginal) => ({
  ...(await importOriginal()),
  deleteObjects: vi.fn().mockResolvedValue(undefined),
}));

const LISTINGS = "/api/listings";
const ADMIN = "/api/admin/listings";

describe("GET /listings", () => {
  it("returns only available listings", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);
    const hidden = await Promise.all(
      ["pending", "rejected", "sold"].map((status) =>
        createListing(seller.id, { status }),
      ),
    );

    const res = await request(app).get(`${LISTINGS}?limit=50`);
    const ids = res.body.data.map((l) => l._id);

    expect(res.status).toBe(200);
    expect(ids).toContain(listing._id.toString());
    hidden.forEach((h) => expect(ids).not.toContain(h._id.toString()));
  });
});

describe("GET /listings/:id visibility", () => {
  it("returns an available listing to a guest", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app).get(`${LISTINGS}/${listing._id}`);
    expect(res.status).toBe(200);
  });

  it.each(["pending", "rejected", "sold"])(
    "returns 404 to a guest for a %s listing",
    async (status) => {
      const seller = await registerUser();
      const listing = await createListing(seller.id, { status });

      const res = await request(app).get(`${LISTINGS}/${listing._id}`);
      expect(res.status).toBe(404);
    },
  );

  it("returns 404 to a non-owner and 200 to the owner and an admin for a pending listing", async () => {
    const seller = await registerUser();
    const other = await registerUser();
    const admin = await makeAdmin();
    const listing = await createListing(seller.id, { status: "pending" });
    const url = `${LISTINGS}/${listing._id}`;

    const get = (token) =>
      request(app).get(url).set("Authorization", bearer(token));

    expect((await get(other.token)).status).toBe(404);
    expect((await get(seller.token)).status).toBe(200);
    expect((await get(admin.token)).status).toBe(200);
  });
});

describe("GET /listings/:id with an unusable token (optionalAuth)", () => {
  // Each case produces a token that protect() would reject with 401.
  const badTokens = {
    revoked: async () => {
      const user = await registerUser();
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", bearer(user.token));
      return user.token;
    },
    "issued before a password change": async () => {
      const user = await registerUser();
      await sleep(2100);
      await request(app)
        .patch("/api/auth/password")
        .set("Authorization", bearer(user.token))
        .send({
          currentPassword: user.password,
          newPassword: "newpassword2026",
        });
      return user.token;
    },
    malformed: async () => "not-a-real-token",
  };

  it.each(Object.keys(badTokens))(
    "treats a %s token as a guest: 200 on available, 404 on pending, never 401",
    async (name) => {
      const token = await badTokens[name]();
      const seller = await registerUser();
      const available = await createListing(seller.id);
      const pending = await createListing(seller.id, { status: "pending" });

      const ok = await request(app)
        .get(`${LISTINGS}/${available._id}`)
        .set("Authorization", bearer(token));
      const hidden = await request(app)
        .get(`${LISTINGS}/${pending._id}`)
        .set("Authorization", bearer(token));

      expect(ok.status).toBe(200);
      expect(hidden.status).toBe(404);
    },
  );
});

describe("Ownership check", () => {
  it("PATCH /listings/:id returns 200 to owners when editing a listing", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(seller.token))
      .send({ price: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(1000);
  });

  it("PATCH /listings/:id returns 404 to non-owners when editing a listing", async () => {
    const seller = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(stranger.token))
      .send({ price: 1000 });
    expect(res.status).toBe(404);
    const after = await Listing.findById(listing._id);
    expect(after.price).toBe(15000);
  });

  it("PATCH /listings/:id returns 404 to admins when editing a listing", async () => {
    const seller = await registerUser();
    const admin = await makeAdmin();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(admin.token))
      .send({ price: 1000 });
    expect(res.status).toBe(404);
    const after = await Listing.findById(listing._id);
    expect(after.price).toBe(15000);
  });

  it("PATCH /listings/:id/sold returns 404 to non-owners when marking a listing as sold", async () => {
    const seller = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}/sold`)
      .set("Authorization", bearer(stranger.token));
    expect(res.status).toBe(404);
    const after = await Listing.findById(listing._id);
    expect(after.status).toBe("available");
  });

  it("PATCH /listings/:id/sold returns 404 to admins when marking a listing as sold", async () => {
    const seller = await registerUser();
    const admin = await makeAdmin();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}/sold`)
      .set("Authorization", bearer(admin.token));
    expect(res.status).toBe(404);
    const after = await Listing.findById(listing._id);
    expect(after.status).toBe("available");
  });

  it("DELETE /listings/:id returns 200 to owners when deleting a listing", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .delete(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(seller.token));
    expect(res.status).toBe(200);
    expect(await Listing.findById(listing._id)).toBeNull();
  });

  it("DELETE /listings/:id returns 200 to admins when deleting a listing", async () => {
    const seller = await registerUser();
    const admin = await makeAdmin();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .delete(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(admin.token));
    expect(res.status).toBe(200);
    expect(await Listing.findById(listing._id)).toBeNull();
  });

  it("DELETE /listings/:id returns 404 to non-owners when deleting a listing", async () => {
    const seller = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .delete(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(stranger.token));
    expect(res.status).toBe(404);
    const after = await Listing.findById(listing._id);
    expect(after.status).toBe("available");
  });
});

describe("Admin review", () => {
  it("PATCH admin/listings/:id/status returns 200 to admins when approving a listing", async () => {
    const admin = await makeAdmin();
    const seller = await registerUser();
    const listing = await createListing(seller.id, { status: "pending" });

    const res = await request(app)
      .patch(`${ADMIN}/${listing._id}/status`)
      .set("Authorization", bearer(admin.token))
      .send({ status: "available" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("available");
  });

  it("PATCH admin/listings/:id/status returns 200 to admins when rejecting a listing", async () => {
    const admin = await makeAdmin();
    const seller = await registerUser();
    const listing = await createListing(seller.id, { status: "pending" });

    const res = await request(app)
      .patch(`${ADMIN}/${listing._id}/status`)
      .set("Authorization", bearer(admin.token))
      .send({ status: "rejected", rejectionReason: "just because" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
    expect(res.body.data.rejectionReason).toBe("just because");
  });

  it("PATCH admin/listings/:id/status returns 400 to admins when rejecting a listing without a reason", async () => {
    const admin = await makeAdmin();
    const seller = await registerUser();
    const listing = await createListing(seller.id, { status: "pending" });

    const res = await request(app)
      .patch(`${ADMIN}/${listing._id}/status`)
      .set("Authorization", bearer(admin.token))
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
  });

  it.each(["available", "rejected", "sold"])(
    "PATCH admin/listings/:id/status returns 409 to an admin when the listing status is %s",
    async (status) => {
      const seller = await registerUser();
      const admin = await makeAdmin();
      const listing = await createListing(seller.id, { status });

      const res = await request(app)
        .patch(`${ADMIN}/${listing._id}/status`)
        .set("Authorization", bearer(admin.token))
        .send({ status: "available" });
      expect(res.status).toBe(409);
    },
  );

  it("PATCH admin/listings/:id/status returns 403 to non-admins", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id, { status: "pending" });

    const res = await request(app)
      .patch(`${ADMIN}/${listing._id}/status`)
      .set("Authorization", bearer(seller.token))
      .send({ status: "rejected" });
    expect(res.status).toBe(403);
    const after = await Listing.findById(listing._id);
    expect(after.status).toBe("pending");
  });
});

describe("Edit and status lifecycle", () => {
  it.each(["available", "pending"])(
    "PATCH /listings/:id returns 200 and ends up pending when editing a listing that is %s",
    async (status) => {
      const seller = await registerUser();
      const listing = await createListing(seller.id, { status });

      const res = await request(app)
        .patch(`${LISTINGS}/${listing._id}`)
        .set("Authorization", bearer(seller.token))
        .send({ price: 1000 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.rejectionReason).toBeNull();
    },
  );

  it("PATCH /listings/:id returns a rejected listing to pending and clears the reason", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id, {
      status: "rejected",
      rejectionReason: "Photos are blurry",
    });

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(seller.token))
      .send({ price: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.rejectionReason).toBeNull();
  });

  it("PATCH /listings/:id returns 409 when editing a sold listing", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id, { status: "sold" });

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}`)
      .set("Authorization", bearer(seller.token))
      .send({ price: 1000 });
    expect(res.status).toBe(409);
  });

  it("PATCH /listings/:id/sold returns 200 when marking an available listing as sold", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);

    const res = await request(app)
      .patch(`${LISTINGS}/${listing._id}/sold`)
      .set("Authorization", bearer(seller.token));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Listing marked as sold");
    expect((await Listing.findById(listing._id)).status).toBe("sold");
  });

  it.each(["pending", "rejected", "sold"])(
    "PATCH /listings/:id/sold returns 409 when marking a %s listing as sold",
    async (status) => {
      const seller = await registerUser();
      const listing = await createListing(seller.id, { status });

      const res = await request(app)
        .patch(`${LISTINGS}/${listing._id}/sold`)
        .set("Authorization", bearer(seller.token));
      expect(res.status).toBe(409);
    },
  );
});
