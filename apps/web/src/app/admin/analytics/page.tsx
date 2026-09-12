"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Report = {
  customers: number;
  vendors: number;
  products: number;
  orders: number;
  gmv: number;
  queues: {
    pendingVendors: number;
    pendingProducts: number;
    openTickets: number;
    refundsPending: number;
    payoutsPending: number;
  };
  topProducts: { name: string; soldCount: number; ratingAvg: number }[];
  salesByDay: { date: string; orders: number; gmv: number }[];
  cached: boolean;
  cacheBackend: string;
};

export default function AdminAnalyticsPage() {
  const [r, setR] = useState<Report | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/analytics";
      return;
    }
    api<Report>("/admin/analytics/report", { token }).then(setR);
  }, []);

  if (!r) return <p className="px-4 py-16 text-center">Loading report…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Analytics</h1>
      <p className="text-sm text-stone-500">
        Cache: {r.cacheBackend}
        {r.cached ? " (hit)" : " (miss)"} · TTL 45s
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {[
          ["Customers", r.customers],
          ["Vendors", r.vendors],
          ["Products", r.products],
          ["Orders", r.orders],
          ["GMV", money(r.gmv)],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-stone-500">{l}</p>
            <p className="text-2xl">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-display text-xl">Queues</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-5 text-sm">
        {Object.entries(r.queues).map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white p-3">
            {k}: {v}
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-display text-xl">Top products</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {r.topProducts.map((p) => (
          <li key={p.name} className="flex justify-between border-b py-2">
            <span>{p.name}</span>
            <span>
              sold {p.soldCount} · {p.ratingAvg.toFixed(1)}★
            </span>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-xl">Sales (14d)</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {r.salesByDay.map((d) => (
          <li key={d.date} className="flex justify-between border-b py-1">
            <span>{d.date}</span>
            <span>
              {d.orders} orders · {money(d.gmv)}
            </span>
          </li>
        ))}
        {r.salesByDay.length === 0 ? <li className="text-stone-500">No sales in window.</li> : null}
      </ul>
    </div>
  );
}
