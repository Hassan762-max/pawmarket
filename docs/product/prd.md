# A. Product Requirements Document — PawMarket

## 1. Problem

Independent pet retailers need a storefront, inventory, orders, and payouts. Customers want one place to buy food, toys, accessories, and habitat products from many shops without juggling multiple checkouts. A generic single-vendor shop cannot split money, shipping, commissions, or liability across sellers.

## 2. Product

PawMarket is a **multi-vendor marketplace SaaS** for legally permitted pet and animal products (food, treats, toys, accessories, grooming, beds, cages, collars, leashes, harnesses, aquariums, training, and related care goods). It is **not** a classifieds site for live-animal sales in v1 unless Admin later enables a dedicated, legally reviewed catalog type.

**Customer experience:** one catalog, one cart, one checkout, one receipt.  
**System reality:** one **parent order**, N **vendor orders**, N possible shipments, one financial ledger.

## 3. Actors

| Actor | Description |
| --- | --- |
| Guest | Browse, search, cart (cookie/anonymous cart), checkout requires account |
| Customer | Buys, tracks, refunds, reviews, support |
| Vendor owner | Onboards, owns stores, staff, payouts, subscriptions |
| Vendor staff | Store-scoped operations (products, orders) without payout/bank access unless granted |
| Admin | Platform operator: approvals, CMS, finance, disputes, settings |
| Support agent | Tickets only (subset of Admin permissions) |
| System | Workers, webhooks, schedulers |

## 4. Goals (v1 complete through Phase 10)

- Multi-vendor cart and split fulfillment
- Trust: vendor KYC-style onboarding + product moderation
- Correct money: commissions, coupons, refunds, payouts via immutable ledger
- SaaS: vendor plans and feature gates
- API-first so mobile clients can follow
- Operable: audit logs, CMS, tickets, analytics

**Non-goals (v1):** live microservices, Elasticsearch in production, native mobile apps, AI features, marketplace-of-marketplaces, multi-currency checkout, real-time in-store POS.

## 5. Catalog scope

Allowed: physical pet products listed in the brief.  
Disallowed by default: live animals, veterinary drugs requiring a license, weapons, illegal items. Admin maintains a **prohibited attributes / category flags** list. Vendors attest compliance at onboarding.

## 6. Core capabilities

### 6.1 Marketplace storefront

Navigation: Home, Shop, Categories, Stores, Deals, New Arrivals, Best Sellers.  
Header: logo, search, categories mega-menu, wishlist, cart, account, “Sell with us”.  
Homepage (CMS-driven): hero, featured categories, popular products, featured stores, best sellers, new arrivals, offers, recommendations (rule-based initially), banners, pet-type tiles (Dogs, Cats, Birds, Fish, Rabbits, Hamsters, Reptiles, Other).

SEO: metadata, OG, Product/Breadcrumb JSON-LD, canonicals, sitemap, robots.txt. SSR/SSG where data is public.

### 6.2 Products

Fields: name, slug, SKU (variant-level unique per store), descriptions, brand, category tree, vendor, store, price, sale price, cost (vendor-private), stock, low-stock threshold, images, video URLs (nullable, player later), weight, dimensions, attributes, variants, tags, status, visibility, approval state.

Variants example: Dog food 1kg / 3kg / 5kg / 10kg — each with SKU, price, stock, weight, images.

### 6.3 Categories

Admin-managed nested tree (e.g. Pet Food → Dog Food → Puppy Food). Products attach to one primary category; additional categories optional later. Slugs unique per locale later; unique globally in v1.

### 6.4 Search

Query: name, brand, category, store, tags, SKU.  
Filters: category, animal type, brand, store, price, rating, availability, discount, attributes.  
Sort: relevance, price, rating, newest, best selling.  
Engine: PostgreSQL; `SearchPort` for OpenSearch.

### 6.5 Cart and checkout

Multi-vendor grouped UI. Server validates product, stock, price, vendor/store status. Never trust client prices, vendor IDs, or totals.

### 6.6 Orders, shipping, payments, finance

See order lifecycle and payment docs. Shipping adapters (manual / carrier later). Payment adapters (Stripe, PayPal, local, COD).

### 6.7 Vendor SaaS

Onboarding funnel → Admin review → store activation. Dashboards for products, inventory, orders, earnings, payouts, staff, analytics. Subscription limits enforced server-side.

### 6.8 Trust and operations

Reviews (verified purchase), coupons (platform + vendor), support tickets, notifications (email + in-app; SMS/push ports), CMS, analytics, audit logs, Admin settings.

## 7. Business rules (must implement)

1. One customer checkout can span many vendors.  
2. Vendors see only their data (query-level isolation).  
3. Admin sees all. Customers see only their orders/PII.  
4. Prices, tax, shipping, discounts, commission, payment status: **server-only**.  
5. Earnings from **ledger**, not from rewriting order totals.  
6. Inventory reservations prevent oversell.  
7. Refunds emit compensating ledger entries; payouts consider refunds.  
8. Reviews require a delivered/completed purchase of that product or store.  
9. Unapproved or suspended vendors cannot sell; unpublished products cannot be newly purchased.  
10. Deleted products do not mutate historical order snapshots.  
11. Sensitive actions are audited.

## 8. UX principles

Friendly, modern, trustworthy, pet-forward — not a generic Amazon clone. Three design surfaces (storefront, vendor, admin) share brand tokens (teal/cream/warm neutrals) with distinct density. Mobile-first, WCAG-minded shadcn, skeletons, empty/error states, toasts, confirmations. Breakpoints: 320, 375, 768, 1024, 1280, 1440+.

## 9. Success metrics

GMV, platform take, take-rate, AOV, conversion, refund rate, time-to-vendor-approval, time-to-first-product, payout cycle time, NPS/support volume. Instrumentation hooks in Phase 9–10.

## 10. Compliance note

v1 is not a substitute for legal advice. Tax remittance, marketplace facilitator laws, animal-product regulations, and KYC/AML depend on launch country. Schema and Admin settings must make region, tax, and payout identity data first-class so a later compliance pass does not require a rewrite.
