"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_KEY, api, money } from "@/lib/api";
import { DashPanel, DashStat } from "@/components/dashboard-shell";

export default function AccountPage() {
  const [me, setMe] = useState<{ firstName: string; email: string; roles: string[] } | null>(null);
  const [orders, setOrders] = useState<{ id: string; number: string; grandTotal: number; status: string }[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<{ firstName: string; email: string; roles: string[] }>("/auth/me", { token }).then(setMe);
    api<{ id: string; number: string; grandTotal: number; status: string }[]>("/orders", { token }).then(setOrders);
    api<{ id: string }[]>("/wishlist", { token })
      .then((rows) => setWishlistCount(rows.length))
      .catch(() => setWishlistCount(0));
  }, []);

  if (!me) return <p className="py-10 text-center text-stone-600">Loading your dashboard…</p>;

  const openOrders = orders.filter((o) => !/delivered|cancelled|canceled|refunded/i.test(o.status)).length;
  const spent = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Your space</p>
        <h1 className="mt-1 font-display text-3xl text-stone-900 md:text-4xl">Welcome back, {me.firstName}</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Track orders, saved pets & gear, and support — all in one place.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashStat label="Orders" value={orders.length} hint={`${openOrders} in progress`} />
        <DashStat label="Wishlist" value={wishlistCount} hint="Saved items" />
        <DashStat label="Total spent" value={money(spent)} hint="All-time" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/shop", label: "Browse shop", blurb: "Food, habitats & live pets" },
          { href: "/account/orders", label: "Order history", blurb: "Receipts & tracking" },
          { href: "/account/addresses", label: "Addresses", blurb: "Delivery defaults" },
          { href: "/account/support", label: "Get help", blurb: "Open a ticket" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <p className="font-medium text-stone-900">{card.label}</p>
            <p className="mt-1 text-sm text-stone-500">{card.blurb}</p>
          </Link>
        ))}
      </div>

      <DashPanel
        title="Recent orders"
        description="Latest marketplace purchases"
        action={
          <Link href="/account/orders" className="text-sm text-brand-800 hover:underline">
            View all
          </Link>
        }
      >
        <ul className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 bg-sand-50/50 px-4 py-3 transition hover:border-brand-300"
              >
                <span className="font-medium">{o.number}</span>
                <span className="text-sm text-stone-600">
                  {o.status} · {money(o.grandTotal)}
                </span>
              </Link>
            </li>
          ))}
          {orders.length === 0 ? (
            <li className="rounded-xl bg-sand-50 px-4 py-8 text-center text-sm text-stone-500">
              No orders yet.{" "}
              <Link href="/shop" className="text-brand-800">
                Explore the shop
              </Link>
            </li>
          ) : null}
        </ul>
      </DashPanel>
    </div>
  );
}
