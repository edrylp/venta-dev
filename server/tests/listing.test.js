import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Listing from "../src/models/Listing.js";
import { MAX_FILES } from "../src/utils/s3.js";

const makeKeys = (n) =>
  Array.from({ length: n }, (_, i) => `listings/user1/photo-${i}.jpg`);

const makeListing = (images) =>
  new Listing({
    userId: new mongoose.Types.ObjectId(),
    category: "GPU",
    title: "RTX 3060 12GB",
    price: 15000,
    description: "Used for one year, works perfectly.",
    location: "Angat, Bulacan",
    images,
  });

describe("Listing model: images", () => {
  it("rejects 0 images", async () => {
    await expect(makeListing([]).validate()).rejects.toMatchObject({
      errors: { images: expect.anything() },
    });
  });

  it(`rejects ${MAX_FILES + 1} images`, async () => {
    await expect(
      makeListing(makeKeys(MAX_FILES + 1)).validate(),
    ).rejects.toMatchObject({
      errors: { images: expect.anything() },
    });
  });

  it("accepts the boundaries (1 and MAX_FILES)", async () => {
    await expect(makeListing(makeKeys(1)).validate()).resolves.toBeUndefined();
    await expect(
      makeListing(makeKeys(MAX_FILES)).validate(),
    ).resolves.toBeUndefined();
  });
});