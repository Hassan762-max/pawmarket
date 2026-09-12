# D. Role and Permission Matrix

Object-level rules always apply **in addition** to this matrix. Vendor isolation is enforced in queries (`WHERE vendorId = auth.vendorId`), not only in the UI.

Legend: **Y** allowed · **O** own records only · **S** store-scoped staff (if permission granted) · **—** denied · **C** configurable

## Platform and identity

| Capability | Guest | Customer | Vendor owner | Vendor staff | Support | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Register / login | Y | Y | Y | Y | Y | Y |
| Browse public catalog | Y | Y | Y | Y | Y | Y |
| Manage own profile | — | O | O | O | O | Y |
| Impersonate user | — | — | — | — | — | C (audited) |
| Manage roles/permissions | — | — | — | — | — | Y |
| View audit logs | — | — | — | — | — | Y |

## Vendors and stores

| Capability | Customer | Vendor owner | Vendor staff | Support | Admin |
| --- | --- | --- | --- | --- | --- |
| Apply as vendor | Y | — | — | — | — |
| Edit own vendor profile / KYC docs | — | O | — | — | Y |
| Approve / reject / suspend vendor | — | — | — | — | Y |
| Create / edit stores | — | O | S | — | Y |
| View all vendors/stores | — | — | — | Y (read) | Y |

## Catalog

| Capability | Customer | Vendor owner | Vendor staff | Admin |
| --- | --- | --- | --- | --- |
| CRUD categories (tree) | — | — | — | Y |
| Create/edit/delete own products | — | O | S | Y |
| Approve/reject products | — | — | — | Y |
| Edit any product | — | — | — | Y |
| Manage own inventory | — | O | S | Y |
| View cost price | — | O | C | Y |

## Commerce

| Capability | Customer | Vendor owner | Vendor staff | Admin |
| --- | --- | --- | --- | --- |
| Cart / checkout | O | —* | — | — |
| View orders | O | O (vendor orders) | S | Y |
| Update fulfillment status | — | O | S | Y |
| Cancel (policy-dependent) | O (early) | O (unshipped) | S | Y |
| Request refund | O | — | — | Y |
| Approve refund | — | — | — | Y |
| Apply coupons at checkout | Y | — | — | — |
| Create vendor coupons | — | O | S | Y |
| Create platform coupons | — | — | — | Y |

\*A user may hold both customer and vendor roles; checkout uses the **customer** principal.

## Money

| Capability | Customer | Vendor owner | Vendor staff | Admin |
| --- | --- | --- | --- | --- |
| View own payments | O | — | — | Y |
| Configure payment/tax/commission | — | — | — | Y |
| View earnings / ledger | — | O | C (no bank details) | Y |
| Request payout | — | O | — | — |
| Approve payout / mark paid | — | — | — | Y |
| View all GMV / reports | — | — | — | Y |

## Content, trust, SaaS

| Capability | Customer | Vendor owner | Vendor staff | Support | Admin |
| --- | --- | --- | --- | --- | --- |
| Wishlist / addresses | O | — | — | — | Y (support view) |
| Review product/store (verified) | O | Reply O | Reply S | Moderate | Moderate |
| CMS / banners / homepage | — | — | — | — | Y |
| Subscription plan CRUD | — | — | — | — | Y |
| Own subscription status | — | O | — | — | Y |
| Support tickets | O | O | S | Y | Y |
| Platform settings | — | — | — | — | Y |

## Permission slugs (seed)

`users:read`, `users:write`,  
`vendors:read`, `vendors:approve`, `vendors:suspend`,  
`stores:write`,  
`categories:write`,  
`products:write`, `products:approve`,  
`inventory:write`,  
`orders:read`, `orders:fulfill`, `orders:refund`,  
`coupons:write_platform`, `coupons:write_vendor`,  
`cms:write`,  
`finance:read`, `finance:payout_approve`, `finance:settings`,  
`subscriptions:write`,  
`support:agent`,  
`analytics:admin`, `analytics:vendor`,  
`audit:read`,  
`settings:write`,  
`staff:manage`.

Staff templates: **Manager** (catalog + orders), **Packer** (fulfill only), **Finance** (earnings read, no payout method change).
