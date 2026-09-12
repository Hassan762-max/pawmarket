# C. Database ERD

PostgreSQL + Prisma. All PKs UUID. Timestamps `createdAt`/`updatedAt` everywhere. Financial amounts: `BigInt` minor units + `currency CHAR(3)`.

## 1. Identity and access

```mermaid
erDiagram
  users ||--o{ refresh_tokens : has
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : assigned
  roles ||--o{ role_permissions : has
  permissions ||--o{ role_permissions : granted
  users ||--o{ addresses : has
  users ||--o{ audit_logs : actor
  users ||--o{ sessions : has

  users {
    uuid id PK
    string email UK
    string passwordHash
    string status
    timestamptz emailVerifiedAt
    string twoFactorSecret
    boolean twoFactorEnabled
    timestamptz deletedAt
  }
  roles {
    uuid id PK
    string slug UK
  }
  permissions {
    uuid id PK
    string slug UK
  }
```

Seed roles: `admin`, `support`, `vendor_owner`, `vendor_staff`, `customer`. Permissions are fine-grained (`products:write`, `payouts:request`, …).

## 2. Vendors, stores, subscriptions

```mermaid
erDiagram
  users ||--o| vendors : owns
  vendors ||--|| vendor_profiles : profile
  vendors ||--o{ vendor_documents : kyc
  vendors ||--o{ vendor_payout_methods : banks
  vendors ||--o{ stores : operates
  vendors ||--o{ vendor_staff : employs
  users ||--o{ vendor_staff : member
  stores ||--|| store_settings : settings
  vendors ||--o{ subscriptions : billed
  subscription_plans ||--o{ subscriptions : plan

  vendors {
    uuid id PK
    uuid ownerUserId FK
    string status
    decimal commissionRateOverride
  }
  stores {
    uuid id PK
    uuid vendorId FK
    string slug UK
    string status
    string logoKey
    string bannerKey
  }
  subscription_plans {
    uuid id PK
    string slug UK
    int productLimit
    boolean advancedAnalytics
    decimal commissionOverride
  }
```

Vendor status: `PENDING_ONBOARDING`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`.  
Store status: `DRAFT`, `ACTIVE`, `PAUSED`, `CLOSED`.

## 3. Catalog and inventory

```mermaid
erDiagram
  categories ||--o{ categories : parent
  categories ||--o{ products : primary
  stores ||--o{ products : sells
  brands ||--o{ products : brands
  products ||--o{ product_variants : variants
  products ||--o{ product_images : images
  products ||--o{ product_attributes : attrs
  products ||--o{ product_tags : tags
  product_variants ||--|| inventory : stock
  inventory ||--o{ inventory_transactions : ledger

  products {
    uuid id PK
    uuid storeId FK
    uuid vendorId FK
    uuid categoryId FK
    string slug
    string approvalStatus
    string visibility
    timestamptz deletedAt
  }
  product_variants {
    uuid id PK
    string sku
    bigint price
    bigint salePrice
    numeric weight
  }
  inventory {
    uuid id PK
    uuid variantId FK
    int onHand
    int reserved
    int sold
    int lowStockThreshold
  }
```

`available = onHand - reserved`. Transactions: `RESERVE`, `RELEASE`, `COMMIT_SALE`, `ADJUST`, `RETURN`.

## 4. Cart, wishlist, coupons

```mermaid
erDiagram
  users ||--o| carts : customer
  carts ||--o{ cart_items : lines
  product_variants ||--o{ cart_items : variant
  users ||--o| wishlists : customer
  wishlists ||--o{ wishlist_items : lines
  coupons ||--o{ coupon_rules : rules
  coupons ||--o{ coupon_redemptions : uses
  stores ||--o{ coupons : vendor_coupons

  cart_items {
    uuid id PK
    uuid storeId FK
    uuid vendorId FK
    uuid variantId FK
    int quantity
  }
  coupons {
    uuid id PK
    string scope
    string type
    string code UK
  }
```

Coupon `scope`: `PLATFORM` | `VENDOR`. Types: `PERCENT`, `FIXED`, `FREE_SHIPPING`.

## 5. Orders, shipping, payments, reviews

```mermaid
erDiagram
  users ||--o{ orders : places
  orders ||--o{ vendor_orders : splits
  stores ||--o{ vendor_orders : fulfills
  vendor_orders ||--o{ order_items : lines
  vendor_orders ||--o{ shipments : ships
  orders ||--o{ payments : pays
  payments ||--o{ payment_transactions : tx
  payments ||--o{ refunds : refunds
  shipping_methods ||--o{ shipments : method
  users ||--o{ reviews : writes
  products ||--o{ reviews : product
  stores ||--o{ reviews : store

  orders {
    uuid id PK
    string number UK
    string status
    bigint merchandiseTotal
    bigint discountTotal
    bigint shippingTotal
    bigint taxTotal
    bigint grandTotal
    string currency
  }
  vendor_orders {
    uuid id PK
    string number UK
    string status
    bigint vendorEarning
    bigint commissionAmount
  }
  order_items {
    uuid id PK
    jsonb snapshot
    bigint unitPrice
    int quantity
  }
```

## 6. Ledger, commissions, payouts

```mermaid
erDiagram
  vendors ||--o{ financial_ledger : entries
  stores ||--o{ financial_ledger : optional_store
  vendor_orders ||--o{ financial_ledger : source
  vendors ||--o{ payouts : requests
  payouts ||--o{ payout_items : lines
  commission_rules ||--o{ commission_rules : none

  financial_ledger {
    uuid id PK
    string entryType
    string account
    bigint amount
    string direction
    uuid idempotencyKey UK
  }
  commission_rules {
    uuid id PK
    string scope
    uuid scopeId
    decimal rate
    int priority
  }
  payouts {
    uuid id PK
    string status
    bigint amount
  }
```

Ledger accounts include `VENDOR_PENDING`, `VENDOR_AVAILABLE`, `VENDOR_PAID`, `PLATFORM_COMMISSION`, `PLATFORM_PROMOTION_EXPENSE`, `TAX_PAYABLE`, `CUSTOMER_PAYMENT`.  
`direction`: `DEBIT` | `CREDIT`. Double-entry: every event posts ≥2 rows in one transaction.

## 7. CMS, support, notifications, search

```mermaid
erDiagram
  cms_pages ||--o{ cms_sections : sections
  banners {
    uuid id PK
    string placement
  }
  support_tickets ||--o{ support_messages : thread
  users ||--o{ notifications : inbox
  search_documents {
    uuid id PK
    string entityType
    tsvector document
  }
  platform_settings {
    uuid id PK
    string key UK
    jsonb value
  }
```

## 8. Indexing (minimum)

- Unique: `users.email`, `stores.slug`, `products(storeId, slug)`, `product_variants(storeId, sku)` (sku unique per store), `orders.number`, `coupons.code`  
- `products(categoryId, approvalStatus, visibility, deletedAt)`  
- `order_items(vendorOrderId)`, `vendor_orders(vendorId, status)`  
- `financial_ledger(vendorId, account, createdAt)`  
- GIN on `search_documents.document`; trigram on product name  
- `audit_logs(actorUserId, entityType, entityId, createdAt)`

## 9. Integrity

FKs with `ON DELETE RESTRICT` for financial/order graphs. Check: `onHand >= 0`, `reserved >= 0`, `quantity > 0`, `rate` between 0 and 1, `grandTotal >= 0`. Partial unique indexes for one active cart per user.
