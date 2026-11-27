# SAVORA — Full-Stack Restaurant Ordering Platform

A complete bilingual (English / العربية, full RTL) restaurant platform: cinematic marketing site, real online ordering with Cash on Delivery, table reservations, customer accounts, and a full admin dashboard. Currency: EGP. Delivery: 27 Egyptian governorates with per-governorate fees.

## Stack

- **Client**: React 18 + TypeScript + Vite + Tailwind CSS, Framer Motion + GSAP (ScrollTrigger) + Lenis smooth scroll + React Three Fiber, i18next (EN/AR with automatic RTL)
- **API**: Node + Express + TypeScript, Zod validation, JWT auth, bcrypt password hashing
- **DB**: Postgres (Neon serverless). All order pricing is computed server-side from the database — the client never sets a price.
- **Images**: 60 AI-generated assets (38 dishes + 22 site images), committed under `client/public/images/`

## Features

- Menu with search, filters (price, vegetarian, spicy, popular, new), 5 sort orders, grid/list layouts, category rail
- Dish pages with sizes, add-ons, special instructions, ingredients, reviews (guest + signed-in), favorites, related dishes
- Cart with coupon validation (SAVORA10, WELCOME15, FREEDEL seeded)
- Checkout: delivery/pickup, governorate-aware delivery fees, saved addresses, schedule-for-later, COD (card payments are gated and honestly rejected until a gateway key is configured — never faked)
- Live order tracking (15s polling) with phone verification, customer cancellation while the kitchen has not started
- Table reservations: live slot availability, automatic best-fit table assignment (double-booking prevented by a unique constraint + row lock)
- Customer accounts: profile, orders, reservations, favorites, address book
- Admin: revenue/orders stats + 14-day sales chart, order management (status flow, ETA, notes), dish CRUD with image upload (stored in DB), reservation table assignment, customers with lifetime spend, coupons, delivery-area + min-order settings, review moderation

## Run locally

```bash
# API (needs .env, see below)
cd server && npm ci && cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD
PORT=8091 npx tsx src/index.ts                # migrates + seeds on first run

# Client (proxies /api to :8091)
cd client && npm ci && npm run dev            # http://localhost:5173
```

`server/.env`:
```
DATABASE_URL=postgres://...   # Neon connection string
JWT_SECRET=...                # any long random string
ADMIN_EMAIL=admin@savora.com
ADMIN_PASSWORD=...            # used only on first seed
```

Admin panel: `/admin` — sign in with the seeded admin account above.

## Tests

```bash
cd server && PORT=8091 npx tsx src/index.ts &   # start API first
node scripts/smoke.mjs                          # 20 end-to-end checks
```

## Deploy (Netlify, one site)

`netlify.toml` is ready: the client builds to `client/dist`, the API runs as a serverless function at `/api/*`, SPA fallback included. Connect the repo and set env vars `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in the Netlify UI. A Vercel entry (`vercel.json` + `api/index.ts`) is also included.

## Notes

- Demo/portfolio project: orders are processed end-to-end in the database but no real food is served.
- Card payment: returns a clear "not configured" error until `PAYMOB_API_KEY` is set — by design, no fake success screens.
