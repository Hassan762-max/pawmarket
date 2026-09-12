"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";
import { DashPanel, DashStat } from "@/components/dashboard-shell";

type Profile = {
  status: string;
  canSell: boolean;
  stores: { name: string; slug: string; status: string }[];
  documents: { fileName: string; type: string; status: string }[];
};

type VendorOrder = {
  number: string;
  status: string;
  merchandiseTotal: number;
  vendorEarning: number;
  commissionAmount: number;
};

export default function VendorOverviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Profile | null>("/vendor/profile", { token }).then((p) => {
      setProfile(p);
      if (!p) window.location.href = "/vendor/onboarding";
    });
    api<VendorOrder[]>("/vendor/orders", { token }).then(setOrders).catch(() => setOrders([]));
  }, []);

  if (!profile) {
    return (
      <VendorShell>
        <p className="py-10 text-center text-stone-600">Loading store pulse…</p>
      </VendorShell>
    );
  }

  const earnings = orders.reduce((s, o) => s + o.vendorEarning, 0);
  const store = profile.stores[0];

  return (
    <VendorShell>
      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Seller hub</p>
          <h1 className="mt-1 font-display text-3xl text-stone-900 md:text-4xl">Overview</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600">
            Store health, documents, and the latest vendor orders.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashStat label="Can sell" value={profile.canSell ? "Yes" : "No"} />
          <DashStat label="Store status" value={store?.status ?? "—"} />
          <DashStat label="Orders" value={orders.length} />
          <DashStat label="Earnings" value={money(earnings)} hint="From listed orders" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/vendor/products/new", label: "Add product", blurb: "List food, habitats, pets" },
            { href: "/vendor/inventory", label: "Inventory", blurb: "Stock levels" },
            { href: "/vendor/orders", label: "Fulfill orders", blurb: "Pack & ship" },
            { href: "/vendor/analytics", label: "Analytics", blurb: "Sales trends" },
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

        <div className="grid gap-4 md:grid-cols-2">
          <DashPanel
            title="Store"
            action={
              <Link href="/vendor/store" className="text-sm text-brand-800 hover:underline">
                Edit profile
              </Link>
            }
          >
            <p className="text-lg font-medium">{store?.name ?? "—"}</p>
            <p className="text-sm text-stone-500">/{store?.slug}</p>
            <p className="mt-3 inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-900">
              {(store?.status ?? profile.status).replaceAll("_", " ")}
            </p>
          </DashPanel>
          <DashPanel title="Documents">
            <ul className="space-y-2 text-sm">
              {profile.documents.map((d) => (
                <li
                  key={d.fileName}
                  className="flex justify-between gap-2 rounded-lg bg-sand-50 px-3 py-2"
                >
                  <span>
                    {d.type}: {d.fileName}
                  </span>
                  <span className="text-stone-500">{d.status}</span>
                </li>
              ))}
              {profile.documents.length === 0 ? (
                <li className="text-stone-500">None uploaded yet.</li>
              ) : null}
            </ul>
          </DashPanel>
        </div>

        <DashPanel
          title="Recent orders"
          description="Merchandise and your net earning"
          action={
            <Link href="/vendor/orders" className="text-sm text-brand-800 hover:underline">
              All orders
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 font-medium">Number</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium">Merchandise</th>
                  <th className="font-medium">Earning</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.number} className="border-b border-stone-100">
                    <td className="py-2.5 font-medium">{o.number}</td>
                    <td>{o.status}</td>
                    <td>{money(o.merchandiseTotal)}</td>
                    <td className="text-brand-800">{money(o.vendorEarning)}</td>
                  </tr>
                ))}
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-500">
                      No vendor orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </DashPanel>
      </div>
    </VendorShell>
  );
}
