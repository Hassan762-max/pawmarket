# E. User Flows

## 1. Customer: register → purchase → delivery

```
Register (email+password)
  → Verify email
  → Browse / search / filter
  → Product page
  → Add to cart (server cart; multi-store groups)
  → Optional: wishlist, apply coupon
  → Checkout: select address, shipping per vendor, payment method
  → Server: validate, reprice, reserve inventory, create payment intent
  → Pay (or COD)
  → Webhook/confirm → Parent order + vendor orders
  → Emails: customer receipt; each vendor “new order”
  → Each vendor: Confirmed → Processing → Packed → Shipped (tracking)
  → Out for delivery → Delivered (per vendor order)
  → Parent fulfillment: Delivered when all children delivered (or cancelled remainder)
  → After refund window: vendor pending → available
  → Customer: review product/store (verified)
```

**Failure paths:** unverified email (limited), out of stock at checkout (line removed/qty reduced), payment fail (`Failed`, release reserve), vendor suspend mid-cart (block those lines).

## 2. Vendor: register → approval → selling → payout

```
Customer/guest → “Sell with us”
  → Vendor register (or attach vendor role to existing user)
  → Personal info
  → Business info
  → Store info (slug, logo, banner)
  → Documents (tax ID, ID scan — stored privately)
  → Payout method (bank / adapter tokens — never log full account)
  → Submit → PENDING_REVIEW
  → Admin: verify, approve or reject with reason
  → APPROVED → store ACTIVE (or Admin activates)
  → Choose/assign subscription plan (FREE default)
  → Add products (+ variants, images, inventory)
  → If product approval on: PENDING → Admin approve → PUBLISHED
  → Orders arrive → fulfill → ship
  → Ledger: PENDING earning on captured payment / delivered per settings
  → Settlement job after refund window → AVAILABLE
  → Payout request (min amount, method)
  → Admin approve → PAID (adapter or manual mark)
```

**Reject/suspend:** cannot publish; existing unshipped orders Admin-policy (cancel or platform-assisted).

## 3. Admin: vendor approval → marketplace management

```
Dashboard KPIs
  → Vendors queue: KYC, approve/reject/suspend/reactivate
  → Products queue: approve/reject/edit
  → Categories tree
  → Orders / payments / refunds / disputes
  → Commission rules
  → Payout queue
  → Coupons, CMS, banners, homepage
  → Reviews moderation
  → Subscription plans
  → Support tickets
  → Settings (currency, tax, approval flags, email)
  → Audit log review
```

Every mutating Admin action writes `audit_logs` (actor, action, entity, before/after, IP, UA).
