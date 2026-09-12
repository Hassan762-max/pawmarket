"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";
import { ImageUrlField } from "@/components/image-url-field";

type Product = {
  id: string;
  name: string;
  brand: string;
  shortDescription: string;
  description?: string;
  approvalStatus: string;
  rejectionReason: string | null;
  visibility: string;
  animalType: string;
  image: string | null;
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    salePrice: number | null;
    onHand: number;
    available: number;
  }[];
};

export default function VendorProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [variantForm, setVariantForm] = useState({
    name: "New size",
    sku: "",
    price: "24.99",
    onHand: "10",
  });

  function load(token: string) {
    api<Product>(`/vendor/products/${id}`, { token }).then(setProduct);
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    load(token);
  }, [id]);

  async function saveBasics(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setError("");
    try {
      await api(`/vendor/products/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: product.name,
          brand: product.brand,
          shortDescription: product.shortDescription,
          description: product.description,
          animalType: product.animalType,
          imageUrl: product.image ?? undefined,
        }),
      });
      setMessage("Saved — sent back to Admin approval.");
      load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function addVariant(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api(`/vendor/products/${id}/variants`, {
      method: "POST",
      token,
      body: JSON.stringify({
        name: variantForm.name,
        sku: variantForm.sku || `SKU-${Date.now()}`,
        price: Math.round(Number(variantForm.price) * 100),
        onHand: Number(variantForm.onHand),
      }),
    });
    setMessage("Variant added.");
    load(token);
  }

  async function removeProduct() {
    if (!confirm("Hide/delete this product from your catalog?")) return;
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api(`/vendor/products/${id}`, { method: "DELETE", token });
    window.location.href = "/vendor/products";
  }

  if (!product) {
    return (
      <VendorShell>
        <p>Loading…</p>
      </VendorShell>
    );
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">{product.name}</h1>
      <p className="text-sm text-stone-600">
        {product.approvalStatus} · {product.visibility}
        {product.rejectionReason ? ` · Rejected: ${product.rejectionReason}` : ""}
      </p>

      <form onSubmit={saveBasics} className="mt-6 max-w-xl space-y-3 rounded-2xl border bg-white p-6">
        {(["name", "brand", "shortDescription", "animalType"] as const).map((k) => (
          <label key={k} className="block text-sm capitalize">
            {k}
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={product[k]}
              onChange={(e) => setProduct({ ...product, [k]: e.target.value })}
            />
          </label>
        ))}
        <label className="block text-sm">
          Description
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={product.description ?? ""}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
          />
        </label>
        <ImageUrlField
          label="Product image"
          value={product.image ?? ""}
          onChange={(image) => setProduct({ ...product, image })}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-brand-800">{message}</p> : null}
        <div className="flex gap-3">
          <button className="rounded-full bg-brand-700 px-4 py-2 text-white">Save</button>
          <button type="button" className="rounded-full border px-4 py-2" onClick={removeProduct}>
            Delete
          </button>
        </div>
      </form>

      <h2 className="mt-10 font-display text-2xl">Variants</h2>
      <ul className="mt-3 space-y-2">
        {product.variants.map((v) => (
          <li key={v.id} className="rounded-xl border bg-white p-3 text-sm">
            {v.name} · {v.sku} · {money(v.salePrice ?? v.price)} · {v.available} available ({v.onHand} on hand)
          </li>
        ))}
      </ul>
      <form onSubmit={addVariant} className="mt-4 flex flex-wrap gap-2 rounded-2xl border bg-white p-4">
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          placeholder="Name"
          value={variantForm.name}
          onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
        />
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          placeholder="SKU"
          value={variantForm.sku}
          onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
        />
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          placeholder="Price"
          value={variantForm.price}
          onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
        />
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          placeholder="Stock"
          value={variantForm.onHand}
          onChange={(e) => setVariantForm({ ...variantForm, onHand: e.target.value })}
        />
        <button className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white">Add variant</button>
      </form>
    </VendorShell>
  );
}
