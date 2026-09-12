"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  productLimit: number;
  storeLimit: number;
  staffLimit: number;
  analyticsLevel: string;
  active: boolean;
  sortOrder: number;
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    priceMonthly: "0",
    productLimit: "25",
    storeLimit: "1",
    staffLimit: "2",
    analyticsLevel: "BASIC",
  });
  const [msg, setMsg] = useState("");

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/plans";
      return;
    }
    api<Plan[]>("/admin/plans", { token }).then(setPlans);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(plan?: Plan) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    const body = plan
      ? {
          id: plan.id,
          slug: plan.slug,
          name: plan.name,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          productLimit: plan.productLimit,
          storeLimit: plan.storeLimit,
          staffLimit: plan.staffLimit,
          analyticsLevel: plan.analyticsLevel,
          active: plan.active,
          sortOrder: plan.sortOrder,
        }
      : {
          ...form,
          priceMonthly: Number(form.priceMonthly),
          productLimit: Number(form.productLimit),
          storeLimit: Number(form.storeLimit),
          staffLimit: Number(form.staffLimit),
        };
    await api("/admin/plans", { method: "PUT", token, body: JSON.stringify(body) });
    setMsg("Saved");
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Plans</h1>
      <ul className="mt-6 space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="rounded-2xl border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {p.name} ({p.slug}) · {money(p.priceMonthly)}/mo
              </p>
              <button
                className="text-brand-800"
                onClick={() =>
                  save({
                    ...p,
                    productLimit: p.productLimit + 10,
                  })
                }
              >
                +10 product limit
              </button>
            </div>
            <p className="text-stone-600">
              {p.productLimit} products · {p.storeLimit} stores · {p.staffLimit} staff · {p.analyticsLevel} ·{" "}
              {p.active ? "active" : "off"}
            </p>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-xl">New plan</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(["slug", "name", "description", "priceMonthly", "productLimit", "storeLimit", "staffLimit", "analyticsLevel"] as const).map(
          (k) => (
            <input
              key={k}
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder={k}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          ),
        )}
      </div>
      <button onClick={() => save()} className="mt-4 rounded-full bg-brand-700 px-5 py-2 text-white">
        Create
      </button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}
