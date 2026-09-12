"use client";

import { use, useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Order = {
  number: string;
  status: string;
  merchandiseTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  shippingAddress: { line1: string; city: string; region: string; postalCode: string } | null;
  payment: { provider: string; status: string } | null;
  vendorOrders: {
    number: string;
    status: string;
    trackingNumber: string | null;
    store: { name: string };
    items: { productName: string; variantName: string; quantity: number; lineTotal: number }[];
  }[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = `/login?next=/account/orders/${id}`;
      return;
    }
    api<Order>(`/orders/${id}`, { token }).then(setOrder);
  }, [id]);

  if (!order) return <p className="py-10 text-center text-stone-600">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">{order.number}</h1>
      <p className="text-stone-600">
        Parent status: {order.status} · Payment {order.payment?.status} ({order.payment?.provider})
      </p>
      {order.shippingAddress ? (
        <p className="mt-2 text-sm">
          Ship to {order.shippingAddress.line1}, {order.shippingAddress.city}{" "}
          {order.shippingAddress.region} {order.shippingAddress.postalCode}
        </p>
      ) : null}

      {order.vendorOrders.map((vo) => (
        <section key={vo.number} className="mt-6 rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">
              {vo.store.name} · {vo.number}
            </p>
            <p className="text-sm text-brand-800">{vo.status}</p>
          </div>
          {vo.trackingNumber ? <p className="mt-1 text-sm">Tracking: {vo.trackingNumber}</p> : null}
          <ul className="mt-3 space-y-1 text-sm">
            {vo.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {i.productName} · {i.variantName} × {i.quantity}
                </span>
                <span>{money(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-6 space-y-1 text-sm">
        <p>Merchandise {money(order.merchandiseTotal)}</p>
        <p>Shipping {money(order.shippingTotal)}</p>
        <p>Tax {money(order.taxTotal)}</p>
        <p className="text-lg font-medium">Total {money(order.grandTotal)}</p>
      </div>
    </div>
  );
}
