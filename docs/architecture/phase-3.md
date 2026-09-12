# Phase 3 — Catalog

## Delivered

- Vendor product CRUD with variants and images
- Inventory list + absolute stock adjust with `InventoryTransaction` ledger
- Checkout uses RESERVE → COMMIT_SALE inventory transactions
- Soft-delete products (`deletedAt` + HIDDEN) without breaking historical orders
- Admin product approve/reject queue
- Admin category create/update/delete (blocks delete when in use)
- Marketplace only shows APPROVED + PUBLISHED + non-deleted products from approved vendors

## Demo

1. Sign in as `vendor.a@pawmarket.local` → **Products** → **Add product**
2. Sign in as `admin@pawmarket.local` → **Product approvals** → approve pending item
3. Confirm it appears on http://localhost:3000/shop
