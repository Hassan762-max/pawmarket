# Phase 7 — SaaS

## Delivered

- Plans: Free / Growth / Pro with product, store, staff, analytics limits
- `VendorSubscription` + stub billing adapter (no live Stripe Billing)
- Product create enforces `PRODUCT_LIMIT` / inactive subscription
- Downgrade blocked if usage exceeds target plan caps
- Admin plan editor `/admin/plans`
- Vendor plan + usage `/vendor/subscription`
- Public `GET /plans`

## Demo

1. Vendor `vendor.a@pawmarket.local` → `/vendor/subscription` (Growth seeded)
2. Admin → `/admin/plans` → bump product limit
3. Switch to Free fails if product count > Free cap
