import type { Metadata } from "next";
import Link from "next/link";
import { API_URL, money } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Shop — PawMarket",
  description: "Buy dog breeds, parrots, aquarium fish, and pet supplies — Pakistan PKR prices.",
};

const animals = ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Hamsters", "Reptiles", "Hens", "Goats", "Cows"];
const sorts = ["newest", "best_selling", "price_asc", "price_desc", "rating"];

/** Prefer live-pet categories at the top of the sidebar */
const CATEGORY_PRIORITY = [
  "dog-breeds",
  "cat-breeds",
  "parrots",
  "aquarium-fish",
  "turtles",
  "rabbits",
  "hamsters",
  "dog-food",
  "cat-food",
  "bird-food",
  "fish-food",
  "turtle-food",
  "aquariums",
  "cages",
];

type Sp = {
  q?: string;
  animal?: string;
  category?: string;
  store?: string;
  sort?: string;
  page?: string;
  onSale?: string;
  minPrice?: string;
  maxPrice?: string;
};

type LeafCat = { name: string; slug: string; animalType?: string | null };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) qs.set(k, v);
  qs.set("page", sp.page ?? "1");
  qs.set("pageSize", "12");

  let products: {
    slug: string;
    name: string;
    image: string;
    priceFrom: number;
    hasSale?: boolean;
    store: { name: string };
  }[] = [];
  let meta: { page: number; totalPages: number; total: number } = { page: 1, totalPages: 1, total: 0 };
  let leafCats: LeafCat[] = [];
  let apiDown = false;

  try {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${API_URL}/products?${qs}`, { cache: "no-store" }),
      fetch(`${API_URL}/categories`, { cache: "no-store" }),
    ]);
    if (!prodRes.ok || !catRes.ok) throw new Error("API returned an error");
    const prodJson = await prodRes.json();
    const catJson = await catRes.json();
    products = prodJson.data ?? [];
    meta = prodJson.meta ?? { page: 1, totalPages: 1, total: 0 };
    const trees = catJson.data ?? catJson;
    leafCats = (trees as { children: LeafCat[] }[])
      .flatMap((t) => t.children ?? [])
      .sort((a, b) => {
        const ai = CATEGORY_PRIORITY.indexOf(a.slug);
        const bi = CATEGORY_PRIORITY.indexOf(b.slug);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
  } catch {
    apiDown = true;
  }

  function href(patch: Partial<Sp> & { clearAnimal?: boolean; clearCategory?: boolean; clearPrice?: boolean }) {
    const next: Sp = { ...sp, ...patch, page: patch.page ?? "1" };
    if (patch.clearAnimal || patch.category) delete next.animal;
    if (patch.clearCategory || patch.animal) delete next.category;
    if (patch.clearPrice) {
      delete next.minPrice;
      delete next.maxPrice;
      delete next.onSale;
    }
    if ("animal" in patch && patch.animal === undefined) delete next.animal;
    if ("category" in patch && patch.category === undefined) delete next.category;
    if ("minPrice" in patch && patch.minPrice === undefined) delete next.minPrice;
    if ("maxPrice" in patch && patch.maxPrice === undefined) delete next.maxPrice;
    if ("onSale" in patch && patch.onSale === undefined) delete next.onSale;

    delete (next as { clearAnimal?: boolean }).clearAnimal;
    delete (next as { clearCategory?: boolean }).clearCategory;
    delete (next as { clearPrice?: boolean }).clearPrice;

    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    return `/shop?${p}`;
  }

  const hasFilters = Boolean(sp.animal || sp.category || sp.minPrice || sp.maxPrice || sp.onSale || sp.q);

  if (apiDown) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Shop temporarily unavailable</h1>
        <p className="mt-3 text-stone-600">
          Catalog API se connect nahi ho saka. Thodi der baad page refresh karein — API chal rahi hogi to products load
          ho jayenge.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand-700 px-5 py-2 text-sm text-white hover:bg-brand-800"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6 text-sm">
        <div className="mesh-panel sticky top-24 rounded-2xl p-4 ring-1 ring-stone-200/70">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Animal</p>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link
                  href={href({ animal: undefined, clearCategory: true, page: "1" })}
                  className={!sp.animal ? "font-medium text-brand-800" : "text-stone-600 hover:text-brand-700"}
                >
                  All
                </Link>
              </li>
              {animals.map((a) => (
                <li key={a}>
                  <Link
                    href={href({ animal: a, clearCategory: true, page: "1" })}
                    className={sp.animal === a ? "font-medium text-brand-800" : "text-stone-600 hover:text-brand-700"}
                  >
                    {a === "Birds" ? "Birds / Parrots" : a}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Category</p>
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-auto">
              {leafCats.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={href({ category: c.slug, clearAnimal: true, page: "1" })}
                    className={
                      sp.category === c.slug ? "font-medium text-brand-800" : "text-stone-600 hover:text-brand-700"
                    }
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Price</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <Link
                href={href({ minPrice: undefined, maxPrice: "500000", onSale: undefined, page: "1" })}
                className="text-stone-600 hover:text-brand-700"
              >
                Under {money(500000)}
              </Link>
              <Link
                href={href({ minPrice: "500000", maxPrice: "5000000", onSale: undefined, page: "1" })}
                className="text-stone-600 hover:text-brand-700"
              >
                {money(500000)}–{money(5000000)}
              </Link>
              <Link
                href={href({ minPrice: "5000000", maxPrice: undefined, onSale: undefined, page: "1" })}
                className="text-stone-600 hover:text-brand-700"
              >
                {money(5000000)}+
              </Link>
              <Link
                href={href({ onSale: "1", minPrice: undefined, maxPrice: undefined, page: "1" })}
                className="font-medium text-brand-800"
              >
                On sale
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div>
        <h1 className="reveal font-display text-4xl">Shop</h1>
        <p className="reveal reveal-delay-1 mt-2 text-stone-600">{meta.total} products from every PawMarket store.</p>
        {hasFilters ? (
          <p className="mt-2 text-sm">
            <span className="text-stone-500">
              Filters: {[sp.animal, sp.category, sp.onSale ? "on sale" : null].filter(Boolean).join(" · ") || "price"}
            </span>
            {" · "}
            <Link href="/shop" className="text-brand-800 underline">
              Clear all
            </Link>
          </p>
        ) : null}
        {meta.total === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
            <p className="font-medium">Is filter pe koi product nahi mila.</p>
            <p className="mt-2">
              Parrots ke liye{" "}
              <Link href="/shop?category=parrots" className="underline">
                Parrots
              </Link>{" "}
              ya{" "}
              <Link href="/shop?animal=Birds" className="underline">
                Birds / Parrots
              </Link>
              ; fish ke liye{" "}
              <Link href="/shop?category=aquarium-fish" className="underline">
                Aquarium Fish
              </Link>{" "}
              ya{" "}
              <Link href="/shop?animal=Fish" className="underline">
                Fish
              </Link>
              .
            </p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {sorts.map((s) => (
            <Link
              key={s}
              href={href({ sort: s, page: "1" })}
              className={`rounded-full px-3 py-1.5 transition ${
                sp.sort === s
                  ? "bg-brand-700 text-white shadow-soft"
                  : "border border-stone-200 bg-white/80 hover:border-brand-300"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard
              key={p.slug}
              index={i}
              product={{
                slug: p.slug,
                name: p.name,
                image: p.image,
                priceFrom: p.priceFrom,
                hasSale: p.hasSale,
                store: p.store,
              }}
            />
          ))}
        </div>
        <div className="mt-10 flex items-center gap-4 text-sm">
          {meta.page > 1 ? (
            <Link href={href({ page: String(meta.page - 1) })} className="font-medium text-brand-800">
              Previous
            </Link>
          ) : null}
          <span className="text-stone-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          {meta.page < meta.totalPages ? (
            <Link href={href({ page: String(meta.page + 1) })} className="font-medium text-brand-800">
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
