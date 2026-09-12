# Phase 6 — Money

## Delivered

- Payment port + `stripe_test` + `cod` adapters (no live Stripe keys required)
- Idempotent webhook stub `POST /payments/webhooks/:provider`
- Checkout writes ledger: CUSTOMER_PAYMENT, TAX_PAYABLE, PLATFORM_COMMISSION, VENDOR_PENDING
- Commission engine (global/vendor bps; default 10%)
- Client total check → `PRICE_CHANGED` if mismatch
- Refunds: customer request → Admin approve/reject (+ optional restock)
- Payouts: vendor request from AVAILABLE → Admin pay/reject
- Pending → Available on vendor order DELIVERED (or manual release)
- UIs: `/vendor/earnings`, `/admin/money`

## Demo

1. Customer checkout multi-store → ledger rows created
2. Vendor marks order DELIVERED → pending releases
3. `/vendor/earnings` → request payout
4. Admin `/admin/money` → Pay
