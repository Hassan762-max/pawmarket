# ADR 0001 — Production defaults for ambiguous requirements

Status: **Proposed** (pending your approval)  
Date: 2026-09-03

These defaults are chosen so implementation is not blocked by unspecified product rules. Changing them after Phase 5 (orders/payments) is expensive; call out disagreements before Phase 1.

## Identity and tenancy

| Topic | Default |
| --- | --- |
| Primary keys | UUID (`uuid` / Prisma `uuid()`, generated in DB) |
| Soft delete | Users, vendors, stores, products, categories, coupons, CMS: `deletedAt`. Orders, payments, ledger, payouts, inventory transactions: **never hard-delete**; status + compensating records |
| Vendor : store | **1 vendor account → N stores**. Products, inventory, orders, coupons, analytics are store-scoped. Vendor staff can be limited to specific stores |
| Selling gate | Vendor must be `APPROVED` and not `SUSPENDED`. Store must be `ACTIVE`. Product must be `APPROVED` + `PUBLISHED` if product-approval setting is on |
| Product approval | Platform setting `productApprovalRequired` **default true** |
| Authenticated vendor | Always from JWT/session `vendorId` / store membership, never from request body |

## Money, currency, tax

| Topic | Default |
| --- | --- |
| Money storage | Integer **minor units** (cents) + ISO 4217 `currency` on every financial row |
| Launch currency | Single marketplace default currency (Admin setting). Multi-currency **schema-ready**, not implemented in Phase 1–6 |
| Tax | Configurable tax rules (rate, inclusive/exclusive). Default: **tax exclusive**, applied on discounted merchandise + shipping if configured. Tax is **not** commissioned and is **not** vendor earning |
| Shipping | Per **vendor order**. Customer may receive multiple shipments. Shipping amount is **not** commissioned unless Admin enables `commissionOnShipping` (default false) |
| Payment model | Platform is **merchant of record**. Customer pays the platform. Vendors are paid later via payouts. Stripe Connect / split pay is an adapter later, not the core model |
| COD | Allowed per region setting. COD orders do not credit vendor available balance until delivery + settlement of collected cash (manual or adapter) |

## Commission (locked precedence)

Effective commission rate for a line item:

1. Product-specific rate if present  
2. Else category-specific rate (walk **leaf → root**; first match wins)  
3. Else vendor-specific rate  
4. Else global platform rate  

Commission **base** = line item merchandise after **vendor-funded** discounts, excluding tax and (by default) shipping.

See [payment-commission.md](../architecture/payment-commission.md).

## Coupons vs vendor earnings

- **Vendor coupons** reduce that vendor’s merchandise subtotal. Commission is taken on the reduced amount. Vendor funds the discount.
- **Platform coupons** reduce what the **customer pays**. Vendor earnings and commission are calculated **as if the platform coupon did not exist**. The platform records `PLATFORM_PROMOTION_EXPENSE` for the coupon amount.
- Free-shipping: vendor coupon → vendor funds shipping; platform coupon → platform expense.
- Discounts apply to merchandise **before** tax (tax-exclusive default).

## Settlement and payouts

| Topic | Default |
| --- | --- |
| Refund window | Configurable; default **14 days after vendor-order DELIVERED** |
| Available balance | Ledger `AVAILABLE` after payment settled **and** refund window elapsed **and** vendor-order not in refund/cancel dispute |
| Payouts | Vendor request + Admin approve (default). Optional auto-payout later |
| Minimum payout | Admin setting; default 5000 minor units ($50.00 if USD) |
| Ledger | Immutable `financial_ledger` rows. Balances are **sums of ledger**, never derived only from mutable order columns |

## Orders and inventory

| Topic | Default |
| --- | --- |
| Price source | Current `product_variants.price` / `salePrice` at checkout; snapshotted onto `order_items` |
| Oversell | `SELECT … FOR UPDATE` on variant inventory row inside a transaction; reserve then commit/release |
| Parent status | Derived from vendor orders (see order lifecycle). Parent also stores a denormalized status for queries |
| Historical products | Soft-delete / unpublish; order lines keep frozen name, SKU, price, image URL |

## Subscriptions

| Topic | Default |
| --- | --- |
| Plans | FREE / PRO / ENTERPRISE seed; Admin-editable |
| Enforcement | Product count, analytics depth, featured-store eligibility, optional commission override on plan |
| Billing | Architecture in Phase 7; Phase 1–6 can assign plans manually by Admin |

## Search, i18n, AI

| Topic | Default |
| --- | --- |
| Search | PostgreSQL `tsvector` + trigram. `SearchPort` interface for later OpenSearch |
| i18n | `next-intl` ready; English-only copy in early phases. No hard-coded `$` in services |
| AI | Ports only (`RecommendationPort`, `FraudPort`, …). No implementation until requested |

## Stack (no change unless blocked)

pnpm workspaces + Turborepo; Next.js App Router; NestJS modular monolith; Prisma + PostgreSQL; Redis; BullMQ worker; S3-compatible storage; Docker Compose locally.
