# Venta

A C2C marketplace for used PC components in the Philippines. Every listing is
reviewed by an admin before it goes live.

> **Status:** In development. Docs phase complete; building toward v0.7.
> Live demo, screenshots and demo credentials will be added in v0.7.

## The problem

Buying and selling used PC hardware on general-purpose platforms is messy:
listings are buried, parts are described inconsistently, and nobody reviews them.

## What it does (MVP)

- Browse, search, filter and sort approved listings (9 hardware categories)
- Register, log in, post listings with 1 to 10 photos (uploaded directly to S3)
- Admin approval workflow before a listing is public
- Message a seller about a listing

Out of scope: payments, shipping, real-time chat, reviews. See the PRD.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Zustand, Axios |
| Backend | Node.js, Express, MongoDB Atlas (Mongoose), JWT, bcrypt |
| Cloud | AWS S3 (pre-signed uploads), Lambda + API Gateway, Vercel |

## Repository structure

    /client   React app
    /server   Express API
    /docs     PRD, TSD

## Getting started (local)

Prerequisites: Node.js, a MongoDB Atlas database, an S3 bucket.

1. Clone the repo.
2. `cd server`, copy `.env.example` to `.env`, fill in the values.
3. `cd client`, copy `.env.example` to `.env`, set `VITE_API_URL`.
4. Install dependencies and start each side (commands added once the scripts exist).

## Documentation

- [PRD](docs/PRD.md) · [TSD](docs/TSD.md)
- ADRs and API docs: links added when published

## Roadmap

Milestones v0.2 to v0.7 are tracked on the GitHub Project board.

## Author

Edryl Palinis