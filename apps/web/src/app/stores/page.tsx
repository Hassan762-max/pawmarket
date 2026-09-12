import Link from "next/link";
import { API_URL } from "@/lib/api";

export default async function StoresPage() {
  const res = await fetch(`${API_URL}/stores`, { cache: "no-store" });
  const json = await res.json();
  const stores = json.data ?? json;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl">Stores</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {stores.map((s: { slug: string; name: string; tagline: string; description: string }) => (
          <Link key={s.slug} href={`/stores/${s.slug}`} className="rounded-2xl border bg-white p-6">
            <p className="text-lg font-medium">{s.name}</p>
            <p className="text-sm text-brand-700">{s.tagline}</p>
            <p className="mt-2 text-sm text-stone-600">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
