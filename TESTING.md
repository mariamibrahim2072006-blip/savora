# SAVORA — Testing report

Live site: https://savora-eg.netlify.app (Netlify, production deploy 2026-11-27)
API: same origin under /api/* (Netlify Function wrapping the Express server; Neon Postgres).

## Automated smoke suite — scripts/smoke.mjs
Run locally (`node scripts/smoke.mjs`) and against production
(`SMOKE_BASE=https://savora-eg.netlify.app/api node scripts/smoke.mjs`).
Result: **20/20 PASS on production** (2026-11-27, EET).

Covers: health, customer register, admin login (role=admin), catalog listing and
dish detail, coupon math (SAVORA10 = 10%), end-to-end COD delivery order with
exact total math (subtotal + addons − coupon + Cairo delivery fee 40 EGP),
public order tracking gated by phone (wrong phone → 403), admin order list and
status advance, customer cancel blocked once preparing, role protection on
admin routes, reservation auto-table assignment, availability slots,
favorites add/list, review submit, and card payment honestly gated (gateway
not configured → clear error, never a fake success).

## Manual visual verification
Screenshots checked page by page (headless Chrome, 1440px): home hero + scroll
sections, menu grid EN and full Arabic RTL (mirrored nav, Arabic-Indic EGP
prices), dish page, cart drawer, checkout EN/AR (delivery/pickup, governorate
select, COD/card options, order summary math), confirmation, tracking,
reservations, auth, dashboard, admin (orders, menu CRUD + image upload,
reservations, customers, promotions, settings, reviews), About, Gallery with
lightbox, Contact, FAQ, Policies. Live production re-verified after deploy.

Note: in headless screenshots the GSAP entrance animations do not play
(virtual-time artifact); they run in real browsers.
