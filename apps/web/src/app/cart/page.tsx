"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money, requireLogin } from "@/lib/api";

type Cart = {
  groups: {
    store: { name: string; slug: string };
    subtotal: number;
    items: {
      id: string;
      productName: string;
      variantName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
  }[];
  merchandiseTotal: number;
  itemCount: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");

  function load() {
    const t = localStorage.getItem(AUTH_KEY);
    if (!t) {
      requireLogin("/cart");
      return;
    }
    api<Cart>("/cart", { token: t }).then(setCart).catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function setQty(id: string, quantity: number) {
    const t = localStorage.getItem(AUTH_KEY);
    if (!t) return;
    const next = await api<Cart>(`/cart/items/${id}`, {
      method: "PATCH",
      token: t,
      body: JSON.stringify({ quantity }),
    });
    setCart(next);
  }

  if (error) return <p className="px-4 py-16 text-center">{error}</p>;
  if (!cart) return <p className="px-4 py-16 text-center">Loading cart…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-stone-600">{cart.itemCount} items · multi-store</p>
      {cart.groups.length === 0 ? (
        <p className="mt-6 text-stone-600">
          Empty. <Link href="/shop">Explore the shop</Link>
        </p>
      ) : (
        cart.groups.map((g) => (
          <section key={g.store.slug} className="mt-8 rounded-2xl border bg-white p-5">
            <Link href={`/stores/${g.store.slug}`} className="font-medium text-brand-800">
              {g.store.name}
            </Link>
            <ul className="mt-3 space-y-3 text-sm">
              {g.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {i.productName} · {i.variantName}
                  </span>
                  <div className="flex items-center gap-3">
                    <button className="rounded border px-2" onClick={() => setQty(i.id, i.quantity - 1)}>
                      −
                    </button>
                    <span>{i.quantity}</span>
                    <button className="rounded border px-2" onClick={() => setQty(i.id, i.quantity + 1)}>
                      +
                    </button>
                    <span className="w-20 text-right">{money(i.lineTotal)}</span>
                    <button className="text-stone-500" onClick={() => setQty(i.id, 0)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right text-sm">Store subtotal {money(g.subtotal)}</p>
          </section>
        ))
      )}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-lg">Merchandise {money(cart.merchandiseTotal)}</p>
        <Link
          href="/checkout"
          className={`rounded-full px-5 py-2 text-white ${cart.groups.length ? "bg-brand-700" : "pointer-events-none bg-stone-300"}`}
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
