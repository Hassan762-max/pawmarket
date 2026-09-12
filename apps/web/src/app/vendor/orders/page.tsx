"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type VendorOrder = {
  id: string;
  number: string;
  status: string;
  trackingNumber: string | null;
  merchandiseTotal: number;
  commissionAmount: number;
  vendorEarning: number;
  store: { name: string };
  items: { productName: string; quantity: number }[];
};

const nextStatus: Record<string, string> = {
  CONFIRMED: "PROCESSING",
  PROCESSING: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<VendorOrder[]>("/vendor/orders", { token }).then(setOrders).catch(() => setOrders([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function advance(o: VendorOrder) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    const status = nextStatus[o.status];
    if (!status) return;
    const trackingNumber =
      status === "SHIPPED" ? `TRK-${o.number.replace(/\W/g, "").slice(-8)}` : o.trackingNumber ?? undefined;
    await api(`/vendor/orders/${o.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status, trackingNumber, carrier: status === "SHIPPED" ? "UPS" : undefined }),
    });
    load();
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-stone-600">JWT-scoped to this vendor only. Advance fulfillment status.</p>
      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-2xl border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {o.number} · {o.store.name}
              </p>
              <p>{o.status}</p>
            </div>
            <p className="mt-1 text-stone-600">
              {o.items.map((i) => `${i.productName}×${i.quantity}`).join(", ")}
            </p>
            <p className="mt-2">
              Merch {money(o.merchandiseTotal)} · Commission {money(o.commissionAmount)} · Earn{" "}
              {money(o.vendorEarning)}
            </p>
            {o.trackingNumber ? <p className="mt-1">Tracking {o.trackingNumber}</p> : null}
            {nextStatus[o.status] ? (
              <button onClick={() => advance(o)} className="mt-3 rounded-full bg-brand-700 px-4 py-1.5 text-white">
                Mark {nextStatus[o.status]}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {orders.length === 0 ? <p className="mt-4 text-stone-500">No orders yet.</p> : null}
    </VendorShell>
  );
}
