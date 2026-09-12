# B. System Architecture

## 1. Style

**Modular monolith** (NestJS) + **Next.js BFF/UI**. One deployable API, one worker, one database. Module boundaries match future services (`OrdersModule`, `PaymentsModule`, …) with **no cross-module deep imports** except through public facades.

```
[Browser / future mobile]
        │  HTTPS REST + JSON
        ▼
   Next.js (apps/web)          NestJS API (apps/api)
   App Router, RSC,            Controllers → Application services
   TanStack Query,             → Domain services → Prisma
   Zustand (cart UI only)             │
        │                             ├── PostgreSQL
        │                             ├── Redis (cache, sessions, rate limit, queues)
        └──── same public API ────────┤
                                      ├── Object storage (S3/R2)
                                      └── SMTP / email adapter
                                              │
                                              ▼
                                       Worker (apps/worker)
                                       BullMQ processors
```

## 2. Applications

| App | Responsibility |
| --- | --- |
| `apps/web` | Storefront, customer, vendor, admin UIs. No financial source of truth |
| `apps/api` | Auth, RBAC, all business rules, Swagger |
| `apps/worker` | Email, webhooks retry, settlement cron, search index, image variants |

Shared packages: `ui`, `config`, `types`, `validation`, `utils`.

## 3. Backend module map

Auth, Users, Roles, Permissions, Vendors, Stores, Products, Categories, Inventory, Cart, Orders, Payments, Commissions, Earnings, Payouts, Subscriptions, Reviews, Coupons, Shipping, Notifications, Support, Analytics, Cms, Audit, Search, Settings, Files.

Coupling rules:

- Inventory is the only module that mutates stock.  
- Orders orchestrates inventory reservation + payment intent + vendor-order split.  
- Payments never imports Orders internals; it emits domain events (`PaymentCaptured`).  
- Earnings/Payouts **only** write/read `financial_ledger`.  
- Notifications subscribe to events; they do not compute prices.

**Future AI:** `RecommendationPort`, `SemanticSearchPort`, `FraudScoringPort`, `CopyGenerationPort` — no-op or heuristic adapters now.

## 4. Request pipeline (API)

1. Correlation ID  
2. Rate limit (Redis)  
3. Auth (JWT access + optional cookie)  
4. Zod/class-validator DTO  
5. RBAC + permission  
6. Object-level policy (vendor isolation)  
7. Service + transaction  
8. Envelope `{ success, data, meta }` or `{ success: false, error }`  
9. Structured log (no secrets)

## 5. Data and consistency

- OLTP: PostgreSQL.  
- Strong consistency for checkout, inventory, ledger (transactions + row locks).  
- Redis cache for public catalog fragments, CMS, session blacklist; **never** cache another user’s private payloads under a shared key.  
- Outbox table for events to the worker (payment captured → emails, settlement).

## 6. Storage

S3-compatible. Upload flow: API issues presigned PUT after MIME/size/auth checks; worker scans/transforms; DB stores keys not public secrets. Images: original + derived sizes.

## 7. Search architecture

`SearchService.indexProduct(productId)` writes `search_documents` (denormalized tsvector). Queries hit that table. Later, the same service dual-writes to OpenSearch without controller changes.

## 8. Payment architecture

```
PaymentService
  ├── StripeAdapter
  ├── PayPalAdapter
  ├── LocalGatewayAdapter
  └── CodAdapter
```

Create intent server-side from order totals. Webhooks verify signatures. Frontend “success” is never authoritative.

## 9. Shipping architecture

```
ShippingService
  ├── ManualAdapter (vendor enters tracking)
  └── CarrierAdapter (future)
```

`Shipment` belongs to `VendorOrder`.

## 10. Frontend architecture

- Routes: see frontend route map.  
- Server Components for public SEO pages.  
- Client: RHF + Zod (shared `packages/validation` with API).  
- TanStack Query for server state.  
- Zustand: guest cart id, UI chrome — **not** prices.  
- Design systems: `packages/ui` tokens + `storefront`, `vendor-shell`, `admin-shell`.

## 11. Observability (hooks now, vendors later)

Pino JSON logs. Error tracking port (Sentry). OpenTelemetry spans on HTTP + Prisma + queue. Metrics port (Prometheus). Health: `/health`, `/ready` (DB + Redis).

## 12. Tradeoffs

| Choice | Why | Cost |
| --- | --- | --- |
| Modular monolith | Faster delivery, one transaction for checkout | Must keep module walls honest |
| Platform MoR | Matches payout + refund window; simpler than Connect | Platform holds funds, higher PCI/compliance burden |
| Prisma | Speed, type safety | Complex reports may need raw SQL later |
| PG search first | Ops-simple | Relevance weaker than OpenSearch |
| UUID PKs | Safer IDs, merge-friendly | Slightly larger indexes |

## 13. Scalability path (not now)

1. Read replicas for catalog.  
2. Extract worker + notifications.  
3. Extract search.  
4. Extract payments.  
5. Split vendor media pipeline.  
Still one orders+ledger database until a proven bottleneck exists.
