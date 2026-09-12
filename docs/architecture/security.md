# L. Security Architecture

## 1. Authentication

- Email/password; **Argon2id** (or bcrypt if Argon2 ops issue) with pepper from env.  
- Email verification required before checkout and before vendor submit.  
- Access JWT short-lived (15m); refresh (7–30d) **rotated**, hashed at rest, reuse detection revokes family.  
- Refresh in httpOnly `Secure` `SameSite=Lax` cookie (web) + optional body for mobile.  
- Password reset: single-use hashed token, 1h TTL.  
- OAuth: provider adapters; link-by-verified-email with explicit confirm.  
- 2FA: `twoFactorSecret` encrypted; enrollment APIs in Phase 10; Admin can require 2FA.

Lockout: rate limit login per IP + per email. Log `auth.failure` without password.

## 2. Authorization

- RBAC + permission slugs.  
- Nest guards: `JwtAuthGuard` → `PermissionsGuard` → `ResourceGuard`.  
- **Vendor isolation:** services take `VendorContext` from JWT (`vendorId`, `storeIds`, staff permissions). Path `vendorId` is ignored. Tests: IDOR on `/vendor/products/:otherId` → 404 (not 403) to avoid existence leak where appropriate.  
- Admin object access still audited.

## 3. Input and output

- Zod/class-validator on all inputs.  
- Parameterized Prisma (no raw SQL string concat).  
- Output DTOs strip `passwordHash`, cost price (unless permitted), payout full account, document private URLs (presign short TTL).  
- HTML: React default escaping; CMS rich text sanitized (allowlist).  
- CSP, frame denial, referrer policy on Next.

## 4. CSRF / CORS / cookies

- Browser mutating cookie auth: CSRF token or SameSite + CORS allowlist of storefront origin only.  
- API CORS: web origin; credentials explicit.

## 5. Payments

- Webhook signature required.  
- Amounts only from DB order.  
- Idempotent event IDs.  
- No card data on our servers (hosted fields / redirect).

## 6. Files

- Presign only after auth + MIME allowlist (jpeg/png/webp/pdf for KYC) + size cap.  
- Store keys in private bucket; KYC never public.  
- Image pipeline: re-encode to strip payloads.

## 7. Abuse and audit

- Redis rate limits: auth, search, checkout, webhooks.  
- `audit_logs` for Admin and sensitive vendor (price, payout method).  
- Structured logs: `requestId`, `userId`, `vendorId`; never tokens or PAN.

## 8. Threat tests (Phase 10, scaffold earlier)

Unauthorized, IDOR, vendor isolation, role escalation, price/commission/coupon/payment tampering, JWT alg confusion/none, refresh reuse.

## 9. Secrets

`.env` not committed. Rotate JWT secrets. Separate webhook secrets per provider. Production: secret manager.
