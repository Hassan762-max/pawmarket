import type { Metadata } from "next";
import Link from "next/link";
import { API_URL, money } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/stores/${slug}`, { cache: "no-store" });
    const json = await res.json();
    const store = json.data ?? json;
    return {
      title: `${store.name} — PawMarket`,
      description: store.tagline || store.description,
    };
  } catch {
    return { title: "Store — PawMarket" };
  }
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/stores/${slug}`, { cache: "no-store" });
  const json = await res.json();
  const store = json.data ?? json;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">{store.name}</h1>
      <p className="mt-2 text-stone-600">{store.description}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(store.products ?? []).map((p: { slug: string; name: string; image: string; priceFrom: number }) => (
          <Link key={p.slug} href={`/products/${p.slug}`} className="overflow-hidden rounded-2xl border bg-white">
            <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }} />
            <div className="p-3">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-brand-800">{money(p.priceFrom)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
