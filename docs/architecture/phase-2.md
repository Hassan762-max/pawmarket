# Phase 2 — Vendor system

## Delivered

- Vendor onboarding API (`POST /vendor/onboarding`) with business, store, payout, documents
- Vendor profile, store update, staff invite stub
- Admin vendor queue: list/filter, approve, reject, suspend, reactivate
- Audit log rows for admin vendor transitions
- Query isolation: vendor orders use JWT `vendorId` only (`requireVendorId`)
- Marketplace only shows `ACTIVE` stores whose vendor is `APPROVED`
- Cart blocks products from non-approved / non-active stores
- UI: `/vendor/onboarding`, vendor shell, `/admin/vendors`

## Demo

| Account | Email | Notes |
| --- | --- | --- |
| Pending vendor | `vendor.pending@pawmarket.local` | In Admin review queue |
| Approved vendor | `vendor.a@pawmarket.local` | Can sell |
| Admin | `admin@pawmarket.local` | Approve/suspend |

Password for all: `Password123!`
