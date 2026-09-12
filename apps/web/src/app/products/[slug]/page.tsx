import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import { ProductClient } from "./product-client";

async function load(slug: string) {
  const res = await fetch(`${API_URL}/products/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: "Product — PawMarket" };
  return {
    title: `${p.name} — PawMarket`,
    description: p.shortDescription || p.description,
    openGraph: { title: p.name, description: p.shortDescription, images: p.image ? [p.image] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductClient slug={slug} />;
}
