# PawMarket

Multi-vendor pet marketplace. Local SQLite (no Docker required).

## Run on localhost

```bash
npm install
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
npm run dev
```

- Storefront: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs

Demo password for all seeded users: `Password123!`

| Role | Email |
| --- | --- |
| Admin | admin@pawmarket.local |
| Customer | customer@pawmarket.local |
| Vendor | vendor.a@pawmarket.local |
