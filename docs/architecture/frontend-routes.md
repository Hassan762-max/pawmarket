# I. Frontend Route Map

Next.js App Router. Route groups: `(storefront)`, `(account)`, `(vendor)`, `(admin)`, `(auth)`.

## Public storefront

| Path | Purpose |
| --- | --- |
| `/` | Homepage (CMS) |
| `/shop` | All products |
| `/categories` | Category index |
| `/categories/[...slug]` | Tree pages |
| `/stores` | Store directory |
| `/stores/[slug]` | Storefront |
| `/products/[slug]` | Product PDP |
| `/search` | Search + filters |
| `/deals` | Discounted |
| `/new` | New arrivals |
| `/best-sellers` | Best sellers |
| `/cart` | Cart |
| `/checkout` | Checkout (auth required) |
| `/pages/[slug]` | CMS pages |
| `/sell` | Vendor marketing + CTA |
| `/robots.txt` `/sitemap.xml` | SEO |

## Auth

| Path |
| --- |
| `/login` `/register` |
| `/verify-email` `/forgot-password` `/reset-password` |
| `/oauth/callback` |

## Customer (`/account`, role customer)

| Path |
| --- |
| `/account` |
| `/account/profile` |
| `/account/addresses` |
| `/account/orders` `/account/orders/[id]` |
| `/account/wishlist` |
| `/account/reviews` |
| `/account/coupons` |
| `/account/notifications` |
| `/account/support` `/account/support/[id]` |
| `/account/settings` |

## Vendor (`/vendor`, vendor roles)

| Path |
| --- |
| `/vendor/onboarding/*` (wizard steps) |
| `/vendor` overview |
| `/vendor/products` `/vendor/products/new` `/vendor/products/[id]` |
| `/vendor/categories` (assigned/read) |
| `/vendor/inventory` |
| `/vendor/orders` `/vendor/orders/[id]` |
| `/vendor/customers` |
| `/vendor/sales` `/vendor/analytics` |
| `/vendor/earnings` `/vendor/payouts` |
| `/vendor/reviews` |
| `/vendor/coupons` |
| `/vendor/store` |
| `/vendor/staff` |
| `/vendor/notifications` |
| `/vendor/support` |
| `/vendor/settings` |
| `/vendor/subscription` |

Pending vendors: onboarding + limited dashboard, no sell.

## Admin (`/admin`)

| Path |
| --- |
| `/admin` analytics |
| `/admin/customers` `/admin/vendors` `/admin/stores` |
| `/admin/products` `/admin/categories` |
| `/admin/orders` `/admin/payments` |
| `/admin/commissions` `/admin/earnings` `/admin/payouts` `/admin/refunds` |
| `/admin/reviews` `/admin/coupons` `/admin/promotions` |
| `/admin/subscriptions` |
| `/admin/support` |
| `/admin/notifications` (broadcast) |
| `/admin/cms` `/admin/reports` `/admin/audit-logs` `/admin/settings` |

## Guards

Middleware: unauthenticated → login with `returnTo`. Wrong role → 403 page. Vendor not approved → onboarding. Admin 2FA later.
