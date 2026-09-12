"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { DashPanel, DashStat } from "@/components/dashboard-shell";

type Stats = {
  customers: number;
  vendors: number;
  products: number;
  orders: number;
  gmv: number;
  queues?: {
    pendingVendors: number;
    pendingProducts: number;
    openTickets: number;
    refundsPending: number;
    payoutsPending: number;
  };
  cached?: boolean;
  cacheBackend?: string;
};

type VendorRow = {
  id: string;
  status: string;
  legalName: string;
  createdAt: string;
  owner: { name: string; email: string };
  stores: { name: string; slug: string; status: string }[];
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Stats>("/admin/analytics/overview", { token }).then(setStats);
    api<VendorRow[]>("/admin/vendors", { token }).then(setVendors);
  }, []);

  if (!stats) return <p className="py-10 text-center text-stone-600">Loading marketplace pulse…</p>;

  const pending = vendors.filter((v) => v.status === "PENDING_REVIEW");
  const q = stats.queues;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Today</p>
        <h1 className="mt-1 font-display text-3xl text-stone-900 md:text-4xl">Marketplace overview</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Monitor GMV, vendor onboarding, and approval queues from one console.
          {stats.cacheBackend ? (
            <span className="text-stone-400">
              {" "}
              · Cache {stats.cacheBackend}
              {stats.cached ? " hit" : " miss"}
            </span>
          ) : null}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <DashStat label="Customers" value={stats.customers} />
        <DashStat label="Vendors" value={stats.vendors} />
        <DashStat label="Products" value={stats.products} />
        <DashStat label="Orders" value={stats.orders} />
        <DashStat label="GMV" value={money(stats.gmv)} hint="Gross merchandise" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending vendors", value: q?.pendingVendors ?? pending.length, href: "/admin/vendors" },
          { label: "Product approvals", value: q?.pendingProducts ?? 0, href: "/admin/products" },
          { label: "Open tickets", value: q?.openTickets ?? 0, href: "/admin/ops" },
          { label: "Payouts pending", value: q?.payoutsPending ?? 0, href: "/admin/money" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-brand-50/40 p-4 shadow-sm transition hover:border-brand-300"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{item.label}</p>
            <p className="mt-2 font-display text-3xl text-brand-900">{item.value}</p>
            <p className="mt-2 text-sm text-brand-700 opacity-0 transition group-hover:opacity-100">Open →</p>
          </Link>
        ))}
      </div>

      <DashPanel
        title="Vendor review queue"
        description="Shops waiting for KYC / catalog approval"
        action={
          <Link href="/admin/vendors" className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800">
            Manage vendors
          </Link>
        }
      >
        <ul className="space-y-3">
          {pending.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-sand-50/60 px-4 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">{v.legalName}</p>
                <p className="text-sm text-stone-500">
                  {v.owner.name} · {v.owner.email} · {v.stores[0]?.name ?? "No store"}
                </p>
              </div>
              <Link
                href="/admin/vendors"
                className="rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm text-brand-800 hover:bg-brand-50"
              >
                Review
              </Link>
            </li>
          ))}
          {pending.length === 0 ? (
            <li className="rounded-xl bg-sand-50 px-4 py-6 text-center text-sm text-stone-500">
              No pending vendors — inbox clear.
            </li>
          ) : null}
        </ul>
      </DashPanel>
    </div>
  );
}
