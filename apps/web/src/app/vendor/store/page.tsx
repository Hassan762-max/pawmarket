"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";
import { ImageUrlField } from "@/components/image-url-field";

type Store = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  status: string;
};

export default function VendorStorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<{ stores: Store[] } | null>("/vendor/profile", { token }).then((p) => {
      setStore(p?.stores[0] ?? null);
    });
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!store) return;
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api(`/vendor/stores/${store.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        name: store.name,
        tagline: store.tagline,
        description: store.description,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
      }),
    });
    setMessage("Store profile saved.");
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Store profile</h1>
      {!store ? (
        <p className="mt-4 text-stone-600">No store yet. Complete onboarding first.</p>
      ) : (
        <form onSubmit={save} className="mt-6 max-w-xl space-y-3 rounded-2xl border bg-white p-6">
          <p className="text-sm text-stone-500">
            Status: {store.status} · /{store.slug}
          </p>
          {(["name", "tagline", "description"] as const).map((k) => (
            <label key={k} className="block text-sm capitalize">
              {k}
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={store[k]}
                onChange={(e) => setStore({ ...store, [k]: e.target.value })}
              />
            </label>
          ))}
          <ImageUrlField
            label="Logo"
            value={store.logoUrl}
            onChange={(logoUrl) => setStore({ ...store, logoUrl })}
            hint="Square works best"
          />
          <ImageUrlField
            label="Banner"
            value={store.bannerUrl}
            onChange={(bannerUrl) => setStore({ ...store, bannerUrl })}
            hint="Wide image for the storefront"
          />
          {message ? <p className="text-sm text-brand-800">{message}</p> : null}
          <button className="rounded-full bg-brand-700 px-5 py-2 text-white">Save</button>
        </form>
      )}
    </VendorShell>
  );
}
