import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import Listing from "../src/models/Listing.js";
import {
  bearer,
  registerUser,
  makeAdmin,
  createListing,
  createConversation,
  createMessage,
} from "./helpers.js";

const CONVERSATIONS = "/api/conversations";
const FAKE_ID = "64b7f0f0f0f0f0f0f0f0f0f0";

const idOf = (res) => res.body.data._id;

const start = (listingId, token) =>
  request(app)
    .post(`${CONVERSATIONS}/${listingId}`)
    .set("Authorization", bearer(token));

const send = (conversationId, token, content = "Hello") =>
  request(app)
    .post(`${CONVERSATIONS}/${conversationId}/messages`)
    .set("Authorization", bearer(token))
    .send({ content });

const readMessages = (conversationId, token) =>
  request(app)
    .get(`${CONVERSATIONS}/${conversationId}/messages`)
    .set("Authorization", bearer(token));

const readConversation = (conversationId, token) =>
  request(app)
    .get(`${CONVERSATIONS}/${conversationId}`)
    .set("Authorization", bearer(token));

const readInbox = (token) =>
  request(app).get(CONVERSATIONS).set("Authorization", bearer(token));

describe("Starting a conversation", () => {
  it("returns 201 for a new conversation on an available listing", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);

    const res = await start(listing._id, buyer.token);
    expect(res.status).toBe(201);
  });

  it("takes sellerId from the listing and ignores one sent by the client", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);

    const res = await start(listing._id, buyer.token).send({
      sellerId: buyer.id,
    });
    expect(res.status).toBe(201);

    const convo = await Conversation.findById(idOf(res));
    expect(convo.sellerId.toString()).toBe(seller.id);
    expect(convo.buyerId.toString()).toBe(buyer.id);
  });

  it("returns 200 and the same conversation when the buyer starts it again", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);

    const first = await start(listing._id, buyer.token);
    const second = await start(listing._id, buyer.token);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(idOf(second)).toBe(idOf(first));
    expect(await Conversation.countDocuments({ listingId: listing._id })).toBe(
      1,
    );
  });

  it("returns 400 when messaging your own listing", async () => {
    const seller = await registerUser();
    const listing = await createListing(seller.id);

    const res = await start(listing._id, seller.token);
    expect(res.status).toBe(400);
  });

  it.each(["pending", "rejected", "sold"])(
    "returns 409 when starting a new conversation on a %s listing",
    async (status) => {
      const seller = await registerUser();
      const buyer = await registerUser();
      const listing = await createListing(seller.id, { status });

      const res = await start(listing._id, buyer.token);
      expect(res.status).toBe(409);
    },
  );

  it("returns the existing conversation (200) when the listing is no longer available", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id, { status: "sold" });
    const convo = await createConversation(listing, buyer.id);

    const res = await start(listing._id, buyer.token);
    expect(res.status).toBe(200);
    expect(idOf(res)).toBe(convo._id.toString());
  });

  it("returns 404 when starting on a deleted listing with no existing conversation", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    await Listing.deleteOne({ _id: listing._id });

    const res = await start(listing._id, buyer.token);
    expect(res.status).toBe(404);
  });

  it("handles two simultaneous starts without an error (duplicate key)", async () => {
    await Conversation.init(); 
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);

    const [a, b] = await Promise.all([
      start(listing._id, buyer.token),
      start(listing._id, buyer.token),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(idOf(a)).toBe(idOf(b));
    expect(await Conversation.countDocuments({ listingId: listing._id })).toBe(
      1,
    );
  });
});

describe("Participant-only access", () => {
  it.each([
    ["read the conversation", (id, token) => readConversation(id, token)],
    ["read the message history", (id, token) => readMessages(id, token)],
    ["send a message", (id, token) => send(id, token)],
  ])("returns 404 to a non-participant trying to %s", async (_label, act) => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    const res = await act(convo._id, stranger.token);
    expect(res.status).toBe(404);
  });

  it("returns 404 to an admin who is not a participant", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const admin = await makeAdmin();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    expect((await readConversation(convo._id, admin.token)).status).toBe(404);
    expect((await readMessages(convo._id, admin.token)).status).toBe(404);
    expect((await send(convo._id, admin.token)).status).toBe(404);
  });

  it("does not save a message sent by a non-participant", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    await send(convo._id, stranger.token, "should not be saved");

    expect(await Message.countDocuments({ conversationId: convo._id })).toBe(0);
  });

  it("lets both the buyer and the seller read the conversation and its messages", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);
    await createMessage(convo._id, buyer.id);

    for (const { token } of [buyer, seller]) {
      expect((await readConversation(convo._id, token)).status).toBe(200);
      const msgs = await readMessages(convo._id, token);
      expect(msgs.status).toBe(200);
      expect(msgs.body.data).toHaveLength(1);
    }
  });

  it("does not leak emails in conversation, message or inbox responses", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);
    await createMessage(convo._id, buyer.id);

    const responses = [
      await readConversation(convo._id, buyer.token),
      await readMessages(convo._id, buyer.token),
      await readInbox(buyer.token),
    ];

    for (const res of responses) {
      expect(res.status).toBe(200);
      const body = JSON.stringify(res.body);
      expect(body).not.toContain(buyer.email);
      expect(body).not.toContain(seller.email);
    }
  });
});

describe("Authentication", () => {
  it.each([
    ["post", `${CONVERSATIONS}/${FAKE_ID}`],
    ["get", CONVERSATIONS],
    ["get", `${CONVERSATIONS}/${FAKE_ID}`],
    ["get", `${CONVERSATIONS}/${FAKE_ID}/messages`],
    ["post", `${CONVERSATIONS}/${FAKE_ID}/messages`],
  ])("returns 401 to a guest on %s %s", async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});

describe("Inbox", () => {
  it("lists the conversation for both the buyer and the seller, and nobody else", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);
    await createMessage(convo._id, buyer.id);

    for (const { token } of [buyer, seller]) {
      const res = await readInbox(token);
      expect(res.status).toBe(200);
      expect(res.body.data.map((c) => c._id)).toContain(convo._id.toString());
    }

    const res = await readInbox(stranger.token);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("hides a conversation with no messages from the inbox but keeps it readable", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    for (const { token } of [buyer, seller]) {
      const inbox = await readInbox(token);
      expect(inbox.body.data).toEqual([]);
    }
    expect((await readConversation(convo._id, buyer.token)).status).toBe(200);
  });
});

describe("Send gate", () => {
  it("lets the buyer and the seller send while the listing is available and updates the preview", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    const first = await send(convo._id, buyer.token, "Is it still available?");
    expect(first.status).toBe(201);

    const afterFirst = await Conversation.findById(convo._id);
    expect(afterFirst.lastMessage).toBe("Is it still available?");
    expect(afterFirst.lastMessageAt).not.toBeNull();

    const second = await send(convo._id, seller.token, "Yes, it is.");
    expect(second.status).toBe(201);

    const afterSecond = await Conversation.findById(convo._id);
    expect(afterSecond.lastMessage).toBe("Yes, it is.");
    expect(afterSecond.lastMessageAt.getTime()).toBeGreaterThanOrEqual(
      afterFirst.lastMessageAt.getTime(),
    );
    expect(await Message.countDocuments({ conversationId: convo._id })).toBe(2);
  });

  it.each(["pending", "rejected", "sold"])(
    "returns 409 on send when the listing is %s, and history stays readable",
    async (status) => {
      const seller = await registerUser();
      const buyer = await registerUser();
      const listing = await createListing(seller.id, { status });
      const convo = await createConversation(listing, buyer.id);
      await createMessage(convo._id, buyer.id);

      expect((await send(convo._id, buyer.token)).status).toBe(409);
      expect((await send(convo._id, seller.token)).status).toBe(409);

      const msgs = await readMessages(convo._id, buyer.token);
      expect(msgs.status).toBe(200);
      expect(msgs.body.data).toHaveLength(1); // the blocked sends saved nothing
    },
  );

  it("returns 404, not 409, to a stranger sending on a sold listing", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const stranger = await registerUser();
    const listing = await createListing(seller.id, { status: "sold" });
    const convo = await createConversation(listing, buyer.id);

    const res = await send(convo._id, stranger.token);
    expect(res.status).toBe(404);
  });
});

describe("Message validation", () => {
  it.each([
    ["empty", ""],
    ["whitespace only", "   "],
    ["1001 characters", "a".repeat(1001)],
  ])("returns 400 for a message that is %s", async (_label, content) => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    const res = await send(convo._id, buyer.token, content);
    expect(res.status).toBe(400);
    expect(await Message.countDocuments({ conversationId: convo._id })).toBe(0);
  });

  it("accepts a message of exactly 1000 characters", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);

    const res = await send(convo._id, buyer.token, "a".repeat(1000));
    expect(res.status).toBe(201);
  });
});

describe("Deleted listing", () => {
  it("keeps the conversation readable, returns listingId null, and blocks sending", async () => {
    const seller = await registerUser();
    const buyer = await registerUser();
    const listing = await createListing(seller.id);
    const convo = await createConversation(listing, buyer.id);
    await createMessage(convo._id, buyer.id);

    await Listing.deleteOne({ _id: listing._id });

    const read = await readConversation(convo._id, buyer.token);
    expect(read.status).toBe(200);
    expect(read.body.data.listingId).toBeNull();

    const msgs = await readMessages(convo._id, seller.token);
    expect(msgs.status).toBe(200);
    expect(msgs.body.data).toHaveLength(1);

    expect((await send(convo._id, buyer.token)).status).toBe(409);
  });
});
