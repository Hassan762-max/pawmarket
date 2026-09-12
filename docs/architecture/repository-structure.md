# K. Recommended Repository Structure

```
pet_store/
  apps/
    web/                     # Next.js App Router
      src/app/
      src/components/
      src/features/
      src/lib/
    api/                     # NestJS modular monolith
      src/main.ts
      src/modules/
        auth/
        users/
        rbac/
        vendors/
        stores/
        products/
        categories/
        inventory/
        cart/
        orders/
        payments/
        commissions/
        earnings/
        payouts/
        subscriptions/
        reviews/
        coupons/
        shipping/
        notifications/
        support/
        analytics/
        cms/
        audit/
        search/
        settings/
        files/
      src/common/            # envelope, filters, interceptors, prisma
    worker/                  # BullMQ processors
  packages/
    ui/                      # shadcn-based shared primitives
    config/                  # eslint, tsconfig, tailwind presets
    types/                   # shared DTO types
    validation/              # Zod schemas shared web/api
    utils/
  infrastructure/
    docker/
      docker-compose.yml
      Dockerfile.api
      Dockerfile.web
      Dockerfile.worker
    deployment/
      README.md
  docs/
    architecture/
    api/
    database/
    decisions/
    product/
  prisma/                    # schema + migrations + seed (or apps/api/prisma)
  .github/workflows/
  .env.example
  package.json               # pnpm workspaces
  pnpm-workspace.yaml
  turbo.json
  README.md
```

`packages/validation` is the single source of request/response shapes. API uses it in Pipes; web uses it in React Hook Form.

Internal module imports: only `index.ts` public API per Nest module.
