# F. Order Lifecycle

## 1. Split model

```
Cart (lines tagged storeId + vendorId, prices ignored from client)
  → Checkout quotation (server)
  → Payment
  → Parent Order  (#10001)
        ├── Vendor Order #10001-A  Store A
        ├── Vendor Order #10001-B  Store B
        └── Vendor Order #10001-C  Store C
              └── Order items (immutable snapshots)
              └── Shipment(s)
```

Parent holds customer identity, addresses copy, grand totals, payment pointer. Vendor orders hold fulfillment, shipping, commission, earning.

## 2. Status vocabulary

Shared enum (vendor order is source of truth for fulfillment):

`PENDING` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`

Also: `CANCELLED`, `REFUND_REQUESTED`, `REFUNDED`, `FAILED`

Admin can add **labels** later; v1 uses this fixed set + `status_events` history. Workflow config: which roles may move from→to (e.g. vendor cannot mark `REFUNDED`).

## 3. Inventory timing

| Step | Inventory |
| --- | --- |
| Add to cart | No reserve (optional short TTL reserve later) |
| Checkout start / pay | `RESERVE` qty |
| Payment fail / expire | `RELEASE` |
| Payment captured | keep reserved |
| Confirmed/processing | `COMMIT_SALE` (onHand -= qty, reserved -= qty, sold += qty) — **on capture** default |
| Cancel before commit | `RELEASE` |
| Refund after commit | `RETURN` restock if Admin/vendor flag `restock=true` |

## 4. Parent status derivation

Denormalized `orders.status` plus `orders.fulfillmentStatus`.

| Children | Parent |
| --- | --- |
| Payment not captured | `PENDING` / `FAILED` |
| All `CANCELLED` | `CANCELLED` |
| All `REFUNDED` | `REFUNDED` |
| Mix of refunded and delivered | `PARTIALLY_REFUNDED` (parent status field; children keep own) |
| All `DELIVERED` | `DELIVERED` |
| Some shipped, none pending payment | `PARTIALLY_SHIPPED` |
| Any `CONFIRMED`/`PROCESSING`/`PACKED` | `PROCESSING` |
| Else | `CONFIRMED` |

`PARTIALLY_SHIPPED` and `PARTIALLY_REFUNDED` are **parent-only** derived values.

## 5. End-to-end money timeline

```
Cart → Checkout → Payment authorized/captured
  → Parent + vendor orders created (CONFIRMED)
  → Fulfillment per vendor
  → DELIVERED
  → Refund window (default 14d)
  → Settlement job: PENDING earning → AVAILABLE (ledger)
  → Payout request → Admin → PAID
```

## 6. Immutability

After capture, `order_items` snapshots never change. Quantity/price corrections use **adjustments** / refunds, not silent edits. Product deletion cannot cascade to order lines.
