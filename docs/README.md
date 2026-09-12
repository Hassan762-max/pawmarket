# Pet Marketplace SaaS — Design Package

Working name: **PawMarket** (configurable via Admin settings; not hard-coded in business logic).

This folder is the **approved-or-pending design baseline**. Implementation of Phase 1 starts only after this package is approved.

| ID | Deliverable | Path |
| --- | --- | --- |
| A | Product Requirements Document | [product/prd.md](./product/prd.md) |
| B | System Architecture | [architecture/system.md](./architecture/system.md) |
| C | Database ERD | [database/erd.md](./database/erd.md) |
| D | Role & Permission Matrix | [architecture/rbac.md](./architecture/rbac.md) |
| E | User Flows | [product/user-flows.md](./product/user-flows.md) |
| F | Order Lifecycle | [architecture/order-lifecycle.md](./architecture/order-lifecycle.md) |
| G | Payment & Commission Flow | [architecture/payment-commission.md](./architecture/payment-commission.md) |
| H | API Specification | [api/specification.md](./api/specification.md) |
| I | Frontend Route Map | [architecture/frontend-routes.md](./architecture/frontend-routes.md) |
| J | Development Roadmap | [architecture/roadmap.md](./architecture/roadmap.md) |
| K | Repository Structure | [architecture/repository-structure.md](./architecture/repository-structure.md) |
| L | Security Architecture | [architecture/security.md](./architecture/security.md) |
| M | Deployment Architecture | [architecture/deployment.md](./architecture/deployment.md) |

Architecture Decision Records (locked defaults for ambiguous requirements): [decisions/0001-architecture-defaults.md](./decisions/0001-architecture-defaults.md).

## How to approve

Reply with approval of this package (optionally listing exceptions). After approval, Phase 1 implementation begins: monorepo, Next.js, NestJS, PostgreSQL, Prisma, Docker, auth, users, RBAC.
