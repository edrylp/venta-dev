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

```text
venta/
├── client/
│   └── .env                       # Frontend environment variables (gitignored)
│   ├── .env.example               # Environment variable template
├── docs/
│   ├── PRD.md
│   └── TSD.md
├── server/
│   ├── scripts/
│   │   └── seedAdmin.js           # Admin-seeding script
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Cached MongoDB connection
│   │   │   └── vine.js            # VineJS custom error messages
│   │   ├── controllers/           
│   │   │   └── authController.js  # Register, login, changePassword, logout controllers
│   │   ├── middleware/
│   │   │   ├── authorize.js       # RBAC authorization middleware
│   │   │   ├── errorHandler.js    # Centralized error handler
│   │   │   ├── protect.js         # JWT verification & token revocation middleware
│   │   │   └── validate.js        # VineJS validator
│   │   ├── models/
│   │   │   ├── RevokedToken.js    # Revoked JWT IDs with a TTL index
│   │   │   └── User.js            # User schema and password hashing
│   │   ├── routes/
│   │   │   └── authRoutes.js      # Auth routes
│   │   ├── utils/
│   │   │   └── generateToken.js   # JWT signing utility
│   │   ├── validators/
│   │   │   └── authValidators.js  # VineJS schemas for the auth endpoints
│   │   ├── app.js                 # Express app configuration; exports app
│   │   └── server.js              # Local development server  
│   ├── tests/
│   │   └── validation.test.js
│   ├── .env                       # Backend environment variables (gitignored)
│   ├── .env.example               # Environment variable template
│   └── package.json
└── README.md
```

## Getting started (local)

Prerequisites: Node.js and a MongoDB Atlas database.

1. Clone the repo.
2. `cd server`, copy `.env.example` to `.env`, fill in the values.
3. Install dependencies and run `npm run dev`.

## Documentation

- [PRD](docs/PRD.md)
- [TSD](docs/TSD.md)

## Roadmap

Milestones v0.2 to v0.7 are tracked on the GitHub Project board.

## Author

Edryl Palinis