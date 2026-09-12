# Phase 9 — Analytics

## Delivered

- Admin report: GMV, queues, top products, 14-day sales (`GET /admin/analytics/report`)
- Vendor dashboard: earnings, low stock, top SKUs, sales by day (`GET /vendor/analytics`)
- Plan gate: BASIC required; ADVANCED unlocks AOV block
- Cache layer: Redis when `REDIS_URL` + `ioredis` available, else in-memory TTL (45s)
- UIs: `/admin/analytics`, `/vendor/analytics`

## Demo

1. Admin → `/admin/analytics` (refresh twice → cache hit)
2. Vendor Growth/Pro → `/vendor/analytics`
3. Optional: set `REDIS_URL=redis://localhost:6379` and install `ioredis`
