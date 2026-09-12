# Phase 11 — Growth

## Delivered

- Referrals: `User.referralCode` / `referredById`; `GET /account/referral`; register accepts `referralCode` / `?ref=`
- Email campaigns (stub SMTP): Admin CRUD + send → in-app + console log
- A/B: `Experiment` + sticky `visitorKey` assignment; home hero uses `home_hero`
- SEO: Open Graph / Twitter meta on root layout (sitemap/robots already Phase 4)

## Demo

1. Account → Referrals → copy link → register in private window with `?ref=`
2. Admin → Growth → create campaign → Send (stub)
3. Admin → Growth → save `home_hero` → refresh homepage (variant A vs B subtitle)
