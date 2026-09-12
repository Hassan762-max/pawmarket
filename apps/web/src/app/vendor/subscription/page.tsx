"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Plan = {
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  productLimit: number;
  storeLimit: number;
  staffLimit: number;
  analyticsLevel: string;
};

type Sub = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  plan: Plan;
  usage: {
    products: number;
    productLimit: number;
    stores: number;
    storeLimit: number;
    staff: number;
    staffLimit: number;
    analyticsLevel: string;
  };
};

export default function VendorSubscriptionPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState("");

  function token() {
    return localStorage.getItem(AUTH_KEY);
  }

  function load() {
    const t = token();
    if (!t) return;
    api<Sub>("/vendor/subscription", { token: t }).then(setSub);
    api<Plan[]>("/plans").then(setPlans);
  }

  useEffect(() => {
    load();
  }, []);

  async function change(planSlug: string) {
    const t = token();
    if (!t) return;
    try {
      await api("/vendor/subscription", {
        method: "POST",
        token: t,
        body: JSON.stringify({ planSlug }),
      });
      setMsg(`Switched to ${planSlug} (stub billing)`);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!sub) return <VendorShell><p>Loading…</p></VendorShell>;

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Subscription</h1>
      <p className="mt-1 text-sm text-stone-600">
        {sub.plan.name} · {sub.status}
        {sub.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ""}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 text-sm">
          Products {sub.usage.products}/{sub.usage.productLimit}
        </div>
        <div className="rounded-2xl border bg-white p-4 text-sm">
          Stores {sub.usage.stores}/{sub.usage.storeLimit}
        </div>
        <div className="rounded-2xl border bg-white p-4 text-sm">
          Analytics {sub.usage.analyticsLevel}
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.slug} className="rounded-2xl border bg-white p-5">
            <p className="font-medium">{p.name}</p>
            <p className="text-2xl text-brand-800">{money(p.priceMonthly)}/mo</p>
            <p className="mt-2 text-sm text-stone-600">{p.description}</p>
            <p className="mt-2 text-xs text-stone-500">
              {p.productLimit} products · {p.storeLimit} stores · {p.analyticsLevel}
            </p>
            <button
              onClick={() => change(p.slug)}
              disabled={p.slug === sub.plan.slug}
              className="mt-4 rounded-full bg-brand-700 px-4 py-2 text-sm text-white disabled:bg-stone-300"
            >
              {p.slug === sub.plan.slug ? "Current" : "Select"}
            </button>
          </div>
        ))}
      </div>
      {msg ? <p className="mt-4 text-sm">{msg}</p> : null}
    </VendorShell>
  );
}
