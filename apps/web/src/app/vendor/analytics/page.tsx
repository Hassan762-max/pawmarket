"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Dash = {
  orders: number;
  merchandiseTotal: number;
  earnings: number;
  commissionPaid: number;
  products: number;
  lowStock: number;
  salesByDay: { date: string; orders: number; merchandise: number }[];
  topSkus: { name: string; qty: number; revenue: number }[];
  advanced: { avgOrderValue: number; conversionHint: string } | null;
  cached: boolean;
  cacheBackend: string;
};

export default function VendorAnalyticsPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Dash>("/vendor/analytics", { token })
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Analytics</h1>
      {err ? <p className="mt-4 text-red-700">{err}</p> : null}
      {!d && !err ? <p className="mt-4">Loading…</p> : null}
      {d ? (
        <>
          <p className="mt-1 text-sm text-stone-500">
            Cache {d.cacheBackend}
            {d.cached ? " hit" : " miss"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 md:grid-cols-6">
            {[
              ["Orders", d.orders],
              ["Merch", money(d.merchandiseTotal)],
              ["Earnings", money(d.earnings)],
              ["Commission", money(d.commissionPaid)],
              ["Products", d.products],
              ["Low stock", d.lowStock],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl border bg-white p-4">
                <p className="text-xs text-stone-500">{l}</p>
                <p className="text-lg">{v}</p>
              </div>
            ))}
          </div>
          {d.advanced ? (
            <p className="mt-4 rounded-xl border bg-brand-50 p-3 text-sm">
              AOV {money(d.advanced.avgOrderValue)} · {d.advanced.conversionHint}
            </p>
          ) : (
            <p className="mt-4 text-sm text-stone-500">Upgrade to Pro for advanced analytics.</p>
          )}
          <h2 className="mt-8 font-display text-xl">Top SKUs</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {d.topSkus.map((s) => (
              <li key={s.name} className="flex justify-between border-b py-2">
                <span>{s.name}</span>
                <span>
                  ×{s.qty} · {money(s.revenue)}
                </span>
              </li>
            ))}
            {d.topSkus.length === 0 ? <li className="text-stone-500">No sales yet.</li> : null}
          </ul>
          <h2 className="mt-8 font-display text-xl">Sales (14d)</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {d.salesByDay.map((x) => (
              <li key={x.date} className="flex justify-between border-b py-1">
                <span>{x.date}</span>
                <span>
                  {x.orders} · {money(x.merchandise)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </VendorShell>
  );
}
