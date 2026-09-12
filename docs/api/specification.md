# H. API Specification (v1 contract)

Base: `/api/v1`  
Auth: `Authorization: Bearer <access>` and/or httpOnly refresh cookie.  
Envelope: `{ success: true, data, meta }` · `{ success: false, error: { code, message, details } }`  
Pagination: `page`, `pageSize` (max 100) → `meta: { page, pageSize, total, totalPages }`  
Sorting: `sort=field:asc|desc`  
Idempotency: `Idempotency-Key` on POST payments, checkout, payouts.

Swagger at `/api/docs` (non-production or admin-protected in prod).

## Auth

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/logout` | user |
| POST | `/auth/refresh` | refresh token |
| POST | `/auth/verify-email` | public |
| POST | `/auth/resend-verification` | public/user |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |
| GET | `/auth/me` | user |
| POST | `/auth/oauth/:provider/callback` | public (Phase 1 stub) |

## Users / addresses / notifications

| Method | Path | Notes |
| --- | --- | --- |
| PATCH | `/me` | profile |
| GET/POST | `/me/addresses` | |
| PATCH/DELETE | `/me/addresses/:id` | own |
| GET | `/me/notifications` | |
| PATCH | `/me/notifications/:id/read` | |

## Catalog (public)

| Method | Path |
| --- | --- |
| GET | `/products` |
| GET | `/products/:slug` |
| GET | `/categories` |
| GET | `/categories/:slug` |
| GET | `/stores` |
| GET | `/stores/:slug` |
| GET | `/search` |
| GET | `/brands` |
| GET | `/cms/homepage` |
| GET | `/banners` |

## Cart / wishlist

| Method | Path |
| --- | --- |
| GET/POST | `/cart` `/cart/items` |
| PATCH/DELETE | `/cart/items/:id` |
| POST | `/cart/quote` |
| GET/POST/DELETE | `/wishlist/items` |

## Customer orders & reviews

| Method | Path |
| --- | --- |
| POST | `/checkout` |
| GET | `/orders` |
| GET | `/orders/:id` |
| POST | `/orders/:id/cancel` |
| POST | `/orders/:id/refund-requests` |
| POST | `/reviews` |
| GET | `/products/:id/reviews` |
| GET | `/stores/:id/reviews` |

## Payments

| Method | Path |
| --- | --- |
| POST | `/payments/intents` |
| GET | `/payments/:id` |
| POST | `/payments/webhooks/:provider` |

## Vendor

Prefix `/vendor`. Principal from auth. All list/get filtered by `vendorId`.

| Method | Path |
| --- | --- |
| POST | `/vendor/onboarding` |
| GET/PATCH | `/vendor/profile` |
| POST | `/vendor/documents` |
| GET/POST/PATCH | `/vendor/stores` `/vendor/stores/:id` |
| GET/POST | `/vendor/products` |
| GET/PATCH/DELETE | `/vendor/products/:id` |
| POST | `/vendor/products/:id/images` |
| GET/POST/PATCH | `/vendor/products/:id/variants` |
| GET/PATCH | `/vendor/inventory` |
| GET | `/vendor/orders` |
| GET | `/vendor/orders/:id` |
| PATCH | `/vendor/orders/:id/status` |
| POST | `/vendor/orders/:id/shipments` |
| GET | `/vendor/customers` |
| GET | `/vendor/earnings` `/vendor/ledger` |
| GET/POST | `/vendor/payouts` `/vendor/payouts/request` |
| GET/POST/PATCH | `/vendor/coupons` |
| GET | `/vendor/reviews` |
| POST | `/vendor/reviews/:id/reply` |
| GET | `/vendor/analytics/overview` |
| GET/POST | `/vendor/staff` |
| GET | `/vendor/subscription` |
| GET | `/vendor/notifications` |

## Admin

Prefix `/admin`. Permissions as matrix.

| Method | Path |
| --- | --- |
| GET | `/admin/analytics/overview` |
| GET | `/admin/customers` `/admin/customers/:id` |
| GET | `/admin/vendors` |
| PATCH | `/admin/vendors/:id/approve` |
| PATCH | `/admin/vendors/:id/reject` |
| PATCH | `/admin/vendors/:id/suspend` |
| PATCH | `/admin/vendors/:id/reactivate` |
| GET | `/admin/stores` `/admin/products` |
| PATCH | `/admin/products/:id/approve` |
| GET/POST/PATCH/DELETE | `/admin/categories` |
| GET | `/admin/orders` `/admin/orders/:id` |
| GET | `/admin/payments` `/admin/refunds` `/admin/payouts` |
| PATCH | `/admin/payouts/:id/approve` |
| GET/POST/PATCH | `/admin/commission-rules` |
| GET/POST/PATCH | `/admin/coupons` `/admin/promotions` |
| GET/POST/PATCH | `/admin/subscription-plans` |
| GET | `/admin/tickets` `/admin/tickets/:id` |
| POST | `/admin/tickets/:id/messages` |
| GET/POST/PATCH | `/admin/cms/*` `/admin/banners` |
| GET | `/admin/audit-logs` |
| GET/PATCH | `/admin/settings` |
| GET | `/admin/reports/:type` |

## Support (customer/vendor)

| Method | Path |
| --- | --- |
| GET/POST | `/support/tickets` |
| GET | `/support/tickets/:id` |
| POST | `/support/tickets/:id/messages` |

## Files

| Method | Path |
| --- | --- |
| POST | `/files/presign` |

## Error codes (non-exhaustive)

`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `EMAIL_NOT_VERIFIED`, `VENDOR_NOT_APPROVED`, `PRODUCT_NOT_PUBLISHED`, `PRODUCT_OUT_OF_STOCK`, `PRICE_CHANGED`, `COUPON_INVALID`, `PAYMENT_FAILED`, `PAYOUT_INSUFFICIENT_BALANCE`, `SUBSCRIPTION_LIMIT`.
