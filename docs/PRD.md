# Venta — Product Requirements Document (PRD)

**Author:** Edryl Palinis · **Version:** 1.0 (Final for MVP build) · **Status:** Aligned with TSD v1.0 · **Docs target:** Oct 30, 2026

> Venta is a C2C marketplace for used PC components in the Philippines. It is a solo portfolio project. The goal is a realistic, solo-scaled SDLC that can be explained in interviews, not a business launch.

## 1. Overview

### 1.1 Problem

Buying and selling used PC hardware on general-purpose platforms is messy. Listings are buried among unrelated items, parts are described inconsistently, and buyers have no sign that anyone reviewed a listing. Hardware is expensive and easy to misrepresent.

### 1.2 Product

Venta is a focused marketplace where anyone can sell and buy used computer hardware. Every listing belongs to a hardware category, has a stated price in PHP, has a location, includes 1 to 10 photos, and is reviewed by an admin before it goes live.

### 1.3 Goals

1. A visitor can find a specific part quickly (browse, filter).
2. A user can post a listing with photos and see its review status.
3. Nothing goes public without admin approval.
4. Buyers and sellers can contact each other about a listing.
5. The project is deployed, demo-ready and documented.

### 1.4 Non-goals

- **No marketing or cold-start solution.** No user acquisition, growth plan or liquidity strategy. The demo runs on seeded data.
- No payments, escrow, shipping or delivery. Deals happen off-platform.
- No real-time chat, reviews or ratings, or email notifications.
- No seller profiles, profile editing, favorites or reporting tools. (Changing your own password is in scope, see U9.)
- No password reset by email, email verification or account deletion.
- No native mobile app. The web app must work on mobile browsers.

## 2. Users

| Role | Description | Can do |
| --- | --- | --- |
| **Guest** | Not logged in | Browse, search, filter, view listing details |
| **User** | Registered buyer and seller (one account does both) | Everything a guest can, plus manage own listings, upload photos, message other users, change password |
| **Admin** | Seeded account, not self-registered | Review pending listings, approve or reject, delete any listing |

Identity: login is by email and password. The `username` is the only identity other users see. Email is never shown publicly.

## 3. Scope

### 3.1 Categories (9)

`Desktop`, `Processor`, `GPU`, `Motherboard`, `RAM`, `Storage`, `PSU`, `Cooler`, `Case`

### 3.2 Listing fields

Category, title (max 100), price (PHP, at least 1), description (10 to 4000 characters), location (free text, max 100), 1 to 10 photos (5 MB max each; JPEG, PNG, or WebP), status.

### 3.3 Listing statuses

| Status | Meaning | Public? |
| --- | --- | --- |
| `pending` | Waiting for admin review | No |
| `available` | Approved and live | Yes |
| `rejected` | Admin said no, with a reason | No |
| `sold` | Seller marked it sold (final) | No (owner and admin only) |

Transitions: new listing starts `pending`. Admin moves `pending` to `available` or `rejected`. Editing an `available` or `rejected` listing returns it to `pending`. Editing a `pending` listing keeps it `pending`. Seller can mark `sold` only from `available`. A `sold` listing cannot be edited.

## 4. User stories

Priority uses MoSCoW. **Must** items are required for the demo journey: sign up, post, get approved, receive a message.

### 4.1 Guest

| ID | Story | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| G1 | As a guest, I can browse available listings | Must | Only `available` listings shown, newest first, 20 per page (max 50), paginated; each card shows the listing's first photo as the thumbnail |
| G2 | I can filter by category | Must | One of the 9 categories narrows the results |
| G3 | I can view listing details | Must | Photo gallery, title, price in PHP, description, location, seller `username`, category |
| G4 | I can search by keyword | Should | `q` matches title and description |
| G5 | I can sort by price or newest | Should | `price_asc`, `price_desc`, `newest` (default) |

### 4.2 User

| ID | Story | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| U1 | I can register | Must | Username (4 to 15 chars; lowercase letters, numbers, underscores), unique email, password of 8+ characters. Role is always `user`. Duplicate username or email gives a clear error |
| U2 | I can log in | Must | Email and password. Same generic error for unknown email and wrong password |
| U3 | I can log out | Must | Token is revoked server-side. Logging out twice is safe |
| U4 | I can change my password | Must | Requires current password (wrong one gives 400). Older tokens stop working; I stay logged in with a fresh token |
| U5 | I can create a listing with photos | Must | 1 to 10 photos, uploaded straight to S3; listing starts `pending` |
| U6 | I can view my own listings | Must | All statuses with badges; rejected listings show the reason |
| U7 | I can edit my listing | Must | Follows the status rules in 3.3; removed photos are deleted from S3; photos must stay between 1 and 10 |
| U8 | I can delete my listing | Must | Listing and its photos are removed; conversations and messages are kept |
| U9 | I can mark my listing sold | Must | Only from `available`; any other status is rejected |
| U10 | As a logged-in user, I can message a seller from a listing | Must | Starts or reopens my single conversation for that listing. Cannot message myself |
| U11 | I can see my inbox | Must | Conversations as buyer or seller, newest activity first, with last-message preview |
| U12 | I can read and send messages in a conversation | Must | Participants only; messages up to 1000 characters; new messages appear on page refresh (no polling or real-time) |

### 4.3 Admin

| ID | Story | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| A1 | I can see the review queue | Must | Pending listings listed |
| A2 | I can approve a listing | Must | `pending` to `available` |
| A3 | I can reject a listing with a reason | Must | Reason required; shown to the seller; cleared when the seller resubmits |
| A4 | I can delete any listing | Must | Same behavior as seller delete |

## 5. Business Rules

- Admins can only move `pending` listings. Any other status returns a conflict.
- A listing that is not `available` is visible only to its owner and admins. For everyone else its link returns 404.
- **Messaging gate:** sending is allowed only while the listing is `available`. If it is pending, rejected, sold, or deleted, the conversation stays readable but sending is blocked.
- Starting a conversation on your own listing is an error. Starting one on a non-available listing is an error, unless you already have a conversation for it, in which case it is returned so you can read the history.
- One conversation per buyer per listing.
- Deleting a listing never deletes its conversations. The UI shows "Listing no longer available".
- Users never set their own `role` or `status`.

## 6. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Security | Passwords hashed with bcrypt (12 rounds); JWT with server-side revocation; ownership checks on every edit and delete; input validation and field whitelisting; Helmet; CORS limited to the Vercel origin |
| Uploads | AWS keys never reach the browser; pre-signed URLs expire in 5 minutes; 5 MB per photo enforced server-side |
| Privacy | Collect only username, email, password. No real name |
| Usability | Responsive, mobile-first; loading, empty, and error states on every page |
| Reliability | Central error handler; unexpected errors logged to CloudWatch, generic message to the client |
| Quality | A handful of automated tests (auth, listing permissions, conversation permissions) plus Postman testing |

## 7. Success Criteria

This is a portfolio project, so success means a demo and a story, not user numbers.

- A visitor can complete the full journey in the live deployment: sign up, post with photos, get approved by admin, receive a message.
- Every phase ships as a tagged milestone (v0.2 to v0.7) with a PR.
- I can explain, without notes, why pre-signed URLs, why JWT revocation, why edits send a listing back to pending, and which trade-offs I accepted.
- README has a live link, screenshots, an architecture diagram, demo credentials, and a trade-offs section.

## 8. Out of Scope and Deferred

| Item | Status |
| --- | --- |
| Payments, `dealMethod`, shipping or meetup flow | Out of scope; handled in messages |
| User profile pages, "sold via seller profile" | Cut from MVP |
| Price-range filter, `condition` field | Cut from MVP |
| Real-time chat, unread indicators | Deferred |
| Reviews and ratings, reporting tools | Deferred |
| Email notifications, password reset by email | Deferred |
| Per-category spec filters, favorites | Deferred |
| CloudFront, refresh tokens or `httpOnly` cookies, Atlas private networking | Deferred (TSD appendix) |