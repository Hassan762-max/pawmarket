import Link from "next/link";
import { API_URL } from "@/lib/api";

export default async function CategoriesPage() {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  const json = await res.json();
  const trees = json.data ?? json;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl">Categories</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {trees.map((root: { id: string; name: string; slug: string; children: { name: string; slug: string }[] }) => (
          <div key={root.id} className="rounded-2xl border bg-white p-5">
            <Link href={`/shop?category=${root.slug}`} className="font-medium">
              {root.name}
            </Link>
            <ul className="mt-3 space-y-1 text-sm text-stone-600">
              {root.children.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
