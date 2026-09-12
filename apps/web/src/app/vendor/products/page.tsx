"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Product = {
  id: string;
  name: string;
  slug: string;
  approvalStatus: string;
  visibility: string;
  image: string | null;
  category: { name: string };
  variants: { price: number; salePrice: number | null; available: number }[];
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Product[]>("/vendor/products", { token }).then(setProducts);
  }, []);

  return (
    <VendorShell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-sm text-stone-600">Only your store&apos;s catalog. Edits re-enter Admin approval.</p>
        </div>
        <Link href="/vendor/products/new" className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white">
          Add product
        </Link>
      </div>
      <div className="mt-6 grid gap-3">
        {products.map((p) => {
          const price = Math.min(...p.variants.map((v) => v.salePrice ?? v.price));
          const stock = p.variants.reduce((s, v) => s + v.available, 0);
          return (
            <Link
              key={p.id}
              href={`/vendor/products/${p.id}`}
              className="flex gap-4 rounded-2xl border bg-white p-4 hover:border-brand-400"
            >
              <div
                className="h-20 w-20 shrink-0 rounded-xl bg-cover bg-center bg-stone-100"
                style={{ backgroundImage: p.image ? `url(${p.image})` : undefined }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-stone-500">
                  {p.category.name} · {p.approvalStatus} · {p.visibility}
                </p>
                <p className="mt-1 text-sm text-brand-800">
                  {money(price)} · {stock} available
                </p>
              </div>
            </Link>
          );
        })}
        {products.length === 0 ? <p className="text-stone-500">No products yet.</p> : null}
      </div>
    </VendorShell>
  );
}
