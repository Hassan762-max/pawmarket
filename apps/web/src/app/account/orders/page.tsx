"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Order = {
  id: string;
  number: string;
  status: string;
  grandTotal: number;
  createdAt: string;
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/account/orders";
      return;
    }
    api<Order[]>("/orders", { token }).then(setOrders);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Orders</h1>
      <ul className="mt-6 space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.id}`} className="block rounded-xl border bg-white p-4">
              <p className="font-medium">{o.number}</p>
              <p className="text-sm text-stone-600">
                {o.status} · {money(o.grandTotal)} · {new Date(o.createdAt).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
        {orders.length === 0 ? <li className="text-stone-500">No orders yet.</li> : null}
      </ul>
    </div>
  );
}
