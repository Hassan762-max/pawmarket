# Phase 5 — Customer commerce

## Delivered

- Cart CRUD with qty update/remove; multi-store grouping; APPROVED+ACTIVE gate
- Wishlist add/remove + `/account/wishlist`
- Addresses CRUD + `/account/addresses`
- Checkout quote (`GET /checkout/quote`) with per-vendor shipping/tax split
- Checkout places parent + vendor orders; address snapshot; RESERVE → COMMIT_SALE
- Customer order list/detail with per-vendor status + tracking
- Vendor order fulfillment advance + tracking (`PATCH /vendor/orders/:id`)
- Parent status derived from vendor children

## Demo

1. Login `customer@pawmarket.local` / `Password123!`
2. Add products from 2+ stores → `/cart` → `/checkout`
3. Place order → `/account/orders/:id`
4. Vendor `vendor.a@pawmarket.local` → `/vendor/orders` → advance status
