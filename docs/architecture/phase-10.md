# Phase 10 — Production readiness

## Delivered

- Security headers + in-process rate limit + prod secret assert
- Swagger disabled in production unless `ENABLE_SWAGGER=true`
- CORS from `CORS_ORIGINS`
- Prisma indexes on products/orders/vendor_orders
- Image CDN helper (`IMAGE_CDN_BASE`) + Sentry/OTel hooks (env-gated)
- Unit tests: commission + auth isolation (`npm run test` in api)
- GitHub Actions CI (`.github/workflows/ci.yml`)
- Staging compose: `infrastructure/docker/docker-compose.staging.yml`
- API Dockerfile

## Go-live checklist

1. Set strong `JWT_*`, `DATABASE_URL`, `PAYMENT_WEBHOOK_SECRET`
2. `prisma migrate deploy` (never migrate on boot in prod)
3. Point `IMAGE_CDN_BASE` / S3
4. Optional: `REDIS_URL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT`
5. Deploy web + api behind TLS; webhooks public only on `/payments/webhooks/*`
