# NaijaAuction — Full-Stack Setup, Security & Deployment Guide

## Architecture Overview

- **Frontend**: React 19, Vite, Tailwind CSS v4, Recharts, Lucide Icons, Socket.IO Client
- **Backend**: Express.js (`server.ts`), Socket.IO real-time server, Helmet security headers, `express-rate-limit`, HMAC CSRF protection, HTTP-only rotating cookie sessions
- **Database**: Cloud SQL PostgreSQL with Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`)
- **Authentication**:
  - Server-side `sessions` table with SHA-256 hashed rotating session tokens in `httpOnly`, `SameSite` cookies
  - Passwords hashed with `bcryptjs` (12 salt rounds)
  - Optional Google Sign-In via Firebase Auth (`firebase` + `firebase-admin`)
  - Email verification & password reset token flows (`email_verification_tokens`, `password_reset_tokens`)
  - Mandatory Auth Gate for live rooms, bidding, watchlist, live discussions, and dashboards

## Database Tables (`src/db/schema.ts`)

- `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions`
- `sessions`, `password_reset_tokens`, `email_verification_tokens`
- `auctions`, `auction_categories`, `auction_images`, `bids`, `watchlists`, `auction_discussions`
- `notifications`, `admin_activity_logs`, `website_settings`

## Environment Variables

Configure these variables in your runtime environment (see `.env.example`):

- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD` — Runtime PostgreSQL credentials
- `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` — Drizzle Kit migration credentials
- `SESSION_HMAC_SECRET` — Strong 64-character secret for signing CSRF tokens
- `INITIAL_ADMIN_PASSWORD` — Optional initial password used on first boot to provision the default Super Admin (`damwad`) with `mustChangePassword = true`. If omitted, the first visitor to the Admin Portal completes the One-Time Super Admin Setup screen for `damwad`.

## Commands

```bash
# Install dependencies
npm install

# Push schema to PostgreSQL
npx drizzle-kit push --config=src/db/drizzle.config.ts

# Start development server (Express + Vite + Socket.IO on port 3000)
npm run dev

# Build production frontend bundle
npm run build

# Start production server
npm start
```

## Role-Based Access Control (RBAC)

- **Super Admin** (`damwad` by default): Complete access to users, administrators, permissions, auctions, categories, website settings, and audit logs.
- **Auction Manager**: Create, edit, schedule, start, pause, close, and cancel auctions; manage categories; inspect bids.
- **User Manager**: View/search users, create ordinary accounts, edit profiles, suspend/ban/reactivate, reset passwords.
