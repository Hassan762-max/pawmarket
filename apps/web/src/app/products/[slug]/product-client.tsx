"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, mediaUrl, money } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  brand: string;
  description: string;
  image: string;
  store: { name: string; slug: string };
  ratingAvg: number;
  variants: { id: string; name: string; price: number; salePrice: number | null; available: number }[];
};

export function ProductClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Product>(`/products/${slug}`).then((p) => {
      setProduct(p);
      setVariantId(p.variants[0]?.id ?? "");
    });
  }, [slug]);

  async function addToCart() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = `/login?next=/products/${slug}`;
      return;
    }
    try {
      await api("/cart/items", {
        method: "POST",
        token,
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      setMessage("Added to cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add");
    }
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24">
        <div className="h-4 w-40 animate-pulse rounded bg-sand-200" />
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-sand-200" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 animate-pulse rounded bg-sand-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand-200" />
            <div className="h-24 w-full animate-pulse rounded bg-sand-200" />
          </div>
        </div>
      </div>
    );
  }

  const v = product.variants.find((x) => x.id === variantId) ?? product.variants[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
      <div className="reveal group relative overflow-hidden rounded-3xl shadow-soft ring-1 ring-stone-200/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(product.image)}
          alt={product.name}
          className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="reveal reveal-delay-1 flex flex-col">
        <p className="text-sm font-medium text-brand-700">{product.store.name}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-ink-900 md:text-5xl">{product.name}</h1>
        <p className="mt-2 text-stone-500">
          {product.brand} · {product.ratingAvg.toFixed?.(1) ?? product.ratingAvg}★
        </p>
        <p className="mt-5 leading-relaxed text-stone-700">{product.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {product.variants.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setVariantId(opt.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                opt.id === variantId
                  ? "border-brand-700 bg-brand-50 text-brand-900 shadow-soft"
                  : "border-stone-200 bg-white hover:border-brand-300"
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
        {v ? (
          <p className="mt-8 font-display text-3xl text-brand-800">
            {money(v.salePrice ?? v.price)}
            {v.salePrice ? <span className="ml-2 text-lg text-stone-400 line-through">{money(v.price)}</span> : null}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={addToCart}
            className="rounded-full bg-brand-700 px-7 py-3 text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-800"
          >
            Add to cart
          </button>
          <button
            onClick={async () => {
              const token = localStorage.getItem(AUTH_KEY);
              if (!token) {
                window.location.href = `/login?next=/products/${slug}`;
                return;
              }
              try {
                await api("/wishlist", {
                  method: "POST",
                  token,
                  body: JSON.stringify({ productId: product.id }),
                });
                setMessage("Saved to wishlist");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Wishlist failed");
              }
            }}
            className="rounded-full border border-brand-700/40 bg-white px-7 py-3 text-brand-800 transition hover:border-brand-700 hover:bg-brand-50"
          >
            Wishlist
          </button>
        </div>
        {message ? <p className="mt-4 animate-fade-in text-sm font-medium text-brand-800">{message}</p> : null}
      </div>
    </div>
  );
}
