"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  approvalStatus: string;
  visibility: string;
  rejectionReason: string | null;
  store: { name: string };
  category: { name: string };
  variants: { price: number; available: number }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [message, setMessage] = useState("");

  function load(token: string, status: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    api<Product[]>(`/admin/products${q}`, { token }).then(setProducts);
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/products";
      return;
    }
    load(token, filter);
  }, [filter]);

  async function act(id: string, action: "approve" | "reject") {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Rejection reason") ?? "";
      if (!reason.trim()) return;
    }
    await api(`/admin/products/${id}/${action}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(reason ? { reason } : {}),
    });
    setMessage(`${action} completed`);
    load(token, filter);
  }

  return (
    <div className="space-y-4">
      <h1 className="mt-2 font-display text-3xl">Products</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 ${filter === s ? "bg-brand-700 text-white" : "border bg-white"}`}
          >
            {s || "All"}
          </button>
        ))}
        <Link href="/admin/categories" className="rounded-full border px-3 py-1">
          Categories
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm text-brand-800">{message}</p> : null}
      <ul className="mt-6 space-y-3">
        {products.map((p) => {
          const price = Math.min(...p.variants.map((v) => v.price));
          const stock = p.variants.reduce((s, v) => s + v.available, 0);
          return (
            <li key={p.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-stone-500">
                    {p.store.name} · {p.category.name} · {p.approvalStatus}/{p.visibility}
                  </p>
                  <p className="mt-1 text-sm">
                    {money(price)} · {stock} available
                  </p>
                  {p.rejectionReason ? (
                    <p className="mt-1 text-sm text-red-700">{p.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="flex gap-2 text-sm">
                  {p.approvalStatus !== "APPROVED" ? (
                    <button
                      className="rounded-full bg-brand-700 px-3 py-1.5 text-white"
                      onClick={() => act(p.id, "approve")}
                    >
                      Approve
                    </button>
                  ) : null}
                  {p.approvalStatus === "PENDING" ? (
                    <button className="rounded-full border px-3 py-1.5" onClick={() => act(p.id, "reject")}>
                      Reject
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
        {products.length === 0 ? <li className="text-stone-500">No products in this filter.</li> : null}
      </ul>
    </div>
  );
}
