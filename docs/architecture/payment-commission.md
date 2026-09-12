# G. Payment and Commission Flow

## 1. How money moves

Customer pays **the platform** (merchant of record). The platform owes vendors **earnings** recorded in an immutable ledger. Vendors are paid on a **payout cycle**, not at click-out (Stripe Connect can later implement the same ledger with a different adapter).

```
Customer  --grandTotal-->  Payment provider  --capture-->  Platform balance
                                                           │
                    ledger: CUSTOMER_PAYMENT (credit platform cash)
                    ledger: tax → TAX_PAYABLE
                    ledger: shipping → vendor or platform per who charged it
                    ledger: commission → PLATFORM_COMMISSION
                    ledger: remainder → VENDOR_PENDING (per vendor)
                                                           │
                              refund window elapsed
                                                           ▼
                                                    VENDOR_AVAILABLE
                                                           │
                                                    Payout adapter
                                                           ▼
                                                    Vendor bank
                                                    VENDOR_PAID
```

## 2. Customer total (server)

For each cart line:

1. Load variant: `unit = salePrice ?? price` (active sale window).  
2. `line = unit * qty`.  
3. Apply **vendor** coupons/discounts that match that store’s lines.  
4. Sum per vendor: merchandise, vendor discount, shipping (chosen method).  
5. Apply **platform** coupons to customer merchandise (and shipping if free-ship platform).  
6. Tax on taxable base (default: discounted merchandise + taxable shipping).  
7. `grandTotal = merchandise - all customer-facing discounts + shipping + tax`.

Never accept `grandTotal` from the client. Compare optional client display total within 0 minor units; mismatch → 409 `PRICE_CHANGED`.

## 3. Commission base and precedence

**Rate precedence (highest wins):** product rule → category rule (leaf to root) → vendor rule → global setting.

**Base (per order item):** merchandise after **vendor-funded** discounts only. Exclude tax. Exclude shipping unless `commissionOnShipping=true`.

```
commissionAmount = round(base * rate)
vendorEarning    = base - commissionAmount
```

Rounding: half-up to minor units; leftover pennies on last line of the vendor order.

### Example A — global 10%, no coupons

Item $100.00 → commission $10.00 → vendor $90.00. Customer pays $100 + shipping + tax.

### Example B — vendor 20% off coupon

Item $100, vendor coupon $20 → base $80 → commission $8 → vendor $72. Customer pays $80 + shipping + tax.

### Example C — platform 20% off coupon

Item $100, platform coupon $20. **Vendor math as if no platform coupon:** commission $10, vendor $90. Customer pays $80 + shipping + tax. Ledger: `PLATFORM_PROMOTION_EXPENSE` $20. Platform net = commission $10 − expense $20 = −$10 (marketing). Admin should cap coupon so expense is intentional.

### Example D — product rate 5% overrides global 10%

Item $100 → commission $5 → vendor $95.

## 4. Payment adapters and webhooks

`POST /payments/intents` creates provider intent with `orderId` metadata.  
`POST /payments/webhooks/:provider` verifies signature, idempotent `payment_transactions.providerEventId`.

States: `REQUIRES_PAYMENT` → `CAPTURED` | `FAILED` | `CANCELLED`. COD: `PENDING_COLLECTION` until delivery marked collected.

Frontend success page only **polls** `GET /orders/:id` (`orders:read` own).

## 5. Refunds

Customer or Admin opens refund (full/partial, line-level). Admin (or policy auto for unshipped) approves.

In one transaction:

- Provider refund (if online captured)  
- `refunds` row  
- Compensating ledger: reduce `VENDOR_PENDING` or `VENDOR_AVAILABLE`; if `VENDOR_PAID`, post `VENDOR_CLAWBACK` (can make available balance negative → next payout nets)  
- Reverse commission proportionally on refunded base  
- Reverse promotion expense if platform coupon allocated to those lines  
- Inventory `RETURN` if restock  

## 6. Payouts

Vendor sees: **Available**, **Pending**, **Total earnings**, **Total commission**, **Paid out**, **Next payout** (from ledger sums + schedule setting).

Request: amount ≤ available, ≥ minimum, not exceeding daily limits. Status `REQUESTED` → `APPROVED` → `PROCESSING` → `PAID` | `REJECTED` | `FAILED`.

Approve posts `VENDOR_AVAILABLE` → `VENDOR_PAID` only after adapter success (or manual confirmation).

## 7. Subscription fees (Phase 7)

Plan charges are separate ledger `PLATFORM_SUBSCRIPTION_REVENUE`, not mixed into GMV commission. Failed subscription → `PAST_DUE` → feature gate / `SUSPENDED` per settings.
