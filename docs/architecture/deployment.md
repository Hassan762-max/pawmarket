# M. Deployment Architecture

## 1. Environments

| Env | Purpose | Data |
| --- | --- | --- |
| Local | Docker Compose: Postgres, Redis, MinIO (S3), Mailhog, api, web, worker | Seed only |
| Staging | Prod-like, Stripe test, isolated DB | Anonymized/seed |
| Production | Multi-AZ later | Real; backups |

Same images, different env vars. No “works only on localhost” URLs in code.

## 2. Local Compose (Phase 1)

Services: `postgres`, `redis`, `minio`, `mailhog`, `api`, `web`, `worker`.  
Networks internal. Ports published only for web/api/mailhog/minio console.

## 3. Production topology (target)

```
CDN (storefront + images)
  → Next.js (SSR)  ──REST──→  API (N replicas)
                                ├── PostgreSQL primary (+ replica reads later)
                                ├── Redis
                                ├── S3/R2
                                └── Queue → Worker replicas
  → Webhooks → API /payments/webhooks (public, signature)
```

Managed Postgres (RDS/Neon/Cloud SQL), Redis (ElastiCache/Upstash), object storage, container orchestration (Fly/Render/ECS/K8s — pick at Phase 10; Compose is not prod HA).

## 4. CI/CD

GitHub Actions: lint, typecheck, unit, Prisma validate, Docker build.  
Staging deploy on `main`. Prod deploy on tag `v*`. Migrations: `prisma migrate deploy` in release job, never from app boot in prod.

## 5. Config

`.env.example` keys: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `S3_*`, `PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `EMAIL_*`, `APP_URL`, `API_URL`, `DEFAULT_CURRENCY`, `LOG_LEVEL`.

## 6. Backups and DR

Daily Postgres snapshots + WAL. Point-in-time recovery. Object storage versioning. Quarterly restore drill (ops runbook in Phase 10).

## 7. Health

`GET /health` liveness, `GET /ready` checks DB+Redis. Worker heartbeats in Redis.

## 9. Phase 10 status

Implemented: security headers, rate limit, prod secret checks, indexes, CI, staging compose, Dockerfile, Sentry/OTel hooks, CDN helper. See [phase-10.md](./phase-10.md).

Staging: `docker compose -f infrastructure/docker/docker-compose.staging.yml up -d`

Migrations in release: `npx prisma migrate deploy` (API workspace).
