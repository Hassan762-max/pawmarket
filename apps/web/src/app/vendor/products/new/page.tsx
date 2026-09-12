"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";
import { ImageUrlField } from "@/components/image-url-field";

type CategoryTree = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};

export default function NewVendorProductPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    brand: "",
    categoryId: "",
    animalType: "Dogs",
    shortDescription: "",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1535294435445-d81cd117d6a5?auto=format&fit=crop&w=800&q=80",
    variantName: "Standard",
    sku: "",
    price: "1999",
    salePrice: "",
    onHand: "20",
  });

  useEffect(() => {
    api<CategoryTree[]>("/categories").then((trees) => {
      const flat: { id: string; name: string }[] = [];
      for (const root of trees) {
        flat.push({ id: root.id, name: root.name });
        for (const child of root.children ?? []) {
          flat.push({ id: child.id, name: `${root.name} / ${child.name}` });
        }
      }
      setCategories(flat);
      if (flat[0]) setForm((f) => ({ ...f, categoryId: flat[0].id }));
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/vendor/products/new";
      return;
    }
    setError("");
    try {
      const price = Math.round(Number(form.price) * 100);
      const salePrice = form.salePrice ? Math.round(Number(form.salePrice) * 100) : null;
      const created = await api<{ id: string }>("/vendor/products", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          categoryId: form.categoryId,
          animalType: form.animalType,
          shortDescription: form.shortDescription,
          description: form.description,
          imageUrl: form.imageUrl,
          tags: ["vendor-created"],
          variants: [
            {
              name: form.variantName,
              sku: form.sku || `SKU-${Date.now()}`,
              price,
              salePrice,
              onHand: Number(form.onHand),
            },
          ],
        }),
      });
      window.location.href = `/vendor/products/${created.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product");
    }
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Add product</h1>
      <p className="mt-1 text-sm text-stone-600">New products start as PENDING until Admin approves them.</p>
      <form onSubmit={submit} className="mt-6 max-w-xl space-y-3 rounded-2xl border bg-white p-6">
        {(
          [
            ["name", "Name"],
            ["brand", "Brand"],
            ["shortDescription", "Short description"],
            ["description", "Description"],
            ["variantName", "Variant name"],
            ["sku", "SKU"],
            ["price", "Price (PKR)"],
            ["salePrice", "Sale price PKR (optional)"],
            ["onHand", "Starting stock"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={!["salePrice", "sku"].includes(key)}
            />
          </label>
        ))}
        <ImageUrlField
          label="Product image"
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
        />
        <label className="block text-sm">
          Category
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Animal type
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.animalType}
            onChange={(e) => setForm({ ...form, animalType: e.target.value })}
          >
            {["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Hamsters", "Reptiles", "Hens", "Goats", "Cows", "Other"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="rounded-full bg-brand-700 px-5 py-2 text-white">Create product</button>
      </form>
    </VendorShell>
  );
}
