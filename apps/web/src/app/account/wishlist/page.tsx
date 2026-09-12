"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Item = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  priceFrom: number;
  store: { name: string; slug: string };
};

export default function WishlistPage() {
  const [items, setItems] = useState<Item[]>([]);

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/account/wishlist";
      return;
    }
    api<Item[]>("/wishlist", { token }).then(setItems);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(productId: string) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setItems(await api<Item[]>(`/wishlist/${productId}`, { method: "DELETE", token }));
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Wishlist</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.id} className="overflow-hidden rounded-2xl border bg-white">
            <Link href={`/products/${i.slug}`}>
              <div className="h-36 bg-cover bg-center" style={{ backgroundImage: i.image ? `url(${i.image})` : undefined }} />
              <div className="p-3">
                <p className="text-xs text-stone-500">{i.store.name}</p>
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-brand-800">{money(i.priceFrom)}</p>
              </div>
            </Link>
            <button onClick={() => remove(i.productId)} className="px-3 pb-3 text-sm text-stone-500">
              Remove
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 ? <p className="mt-6 text-stone-500">No saved products.</p> : null}
    </div>
  );
}
