# J. Development Roadmap

Each phase leaves the repo **bootable** (`docker compose up`, lint, tests for that phase). No Phase N+1 until Phase N is complete.

## Phase 1 — Foundation

Monorepo (pnpm + Turbo), `apps/web` Next.js, `apps/api` NestJS, `apps/worker` stub, Postgres, Prisma, Redis, Docker Compose, `.env.example`, ESLint/Prettier/Husky, conventional commits, envelope errors, Auth (register/login/verify/reset/refresh/RBAC), Swagger, seed Admin + roles.

**Exit:** login as Admin and Customer against local API; JWT isolation tests.

## Phase 2 — Vendor system

Vendor onboarding APIs + wizard UI, documents upload, store create, Admin approve/reject/suspend, vendor shell dashboard, staff stub, vendor isolation tests.

## Phase 3 — Catalog

Categories CRUD, products/variants/images, inventory transactions, Admin product approval, vendor product UI.

## Phase 4 — Marketplace

Homepage CMS minimum (hero + sections), search/filters/sort, category/store/PDP pages, SEO metadata, seed 50+ products.

## Phase 5 — Customer commerce

Cart, wishlist, addresses, checkout split, parent + vendor orders, order tracking UIs, reservation transactions.

## Phase 6 — Money

Payment port + Stripe adapter (test mode) + webhook, COD stub, refunds, commission engine, ledger, payout request/approve, never trust client totals (security tests).

## Phase 7 — SaaS

Plans, limits (product cap, analytics), Admin plan editor, subscription statuses, billing adapter stub.

## Phase 8 — Operations

Notifications (email + in-app), reviews verified, coupons, shipping/tracking, support tickets, fuller CMS.

## Phase 9 — Analytics

Admin + vendor dashboards/reports (SQL views). Redis cache for expensive aggregates.

## Phase 10 — Production

Security pass, perf (indexes, N+1, image CDN), unit/integration/e2e of critical flows, CI/CD, Sentry/OTel hooks, staging compose, deployment docs.

## Phase 11 — Growth

Referrals, SEO polish, email campaigns (stub), A/B experiments.

## Parallel quality bar

Every phase: DTO validation, permission guards, docs update, tests for new rules. E2E of full checkout lands in Phase 6+; Phase 1 e2e = auth only.
