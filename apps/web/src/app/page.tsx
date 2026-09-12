import Link from "next/link";
import { API_URL } from "@/lib/api";
import { HeroAb } from "@/components/hero-ab";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { BrandLogo } from "@/components/brand-logo";

async function loadHome() {
  const res = await fetch(`${API_URL}/homepage`, { cache: "no-store" });
  const json = await res.json();
  return json.data ?? json;
}

export default async function HomePage() {
  let home: {
    hero: { title: string; subtitle: string; image: string };
    featuredCategories: { name: string; slug: string; imageUrl: string }[];
    popularProducts: ProductCardData[];
    featuredStores: { name: string; slug: string; tagline: string }[];
    deals: ProductCardData[];
    newArrivals: ProductCardData[];
    animalTypes: string[];
  } | null = null;
  try {
    home = await loadHome();
  } catch {
    home = null;
  }

  if (!home) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">PawMarket is starting</h1>
        <p className="mt-3 text-stone-600">
          The API is not reachable yet. Keep this tab open — once the backend is up on port 3001, refresh.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{ backgroundImage: `url(${home.hero.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-ink-900/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-ink-900/20" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 text-white md:justify-center md:pb-24">
          <div className="reveal">
            <BrandLogo href="" variant="light" size="hero" />
          </div>
          <h1 className="reveal reveal-delay-1 mt-4 max-w-xl font-display text-2xl font-medium leading-snug text-brand-100 md:text-3xl text-balance">
            {home.hero.title}
          </h1>
          <div className="reveal reveal-delay-2">
            <HeroAb fallback={home.hero.subtitle} />
          </div>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-400"
            >
              Shop the marketplace
            </Link>
            <Link
              href="/stores"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm backdrop-blur transition hover:bg-white/20"
            >
              Browse stores
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-ink-900">Shop by animal</h2>
        <p className="mt-2 max-w-lg text-stone-600">Find pets and supplies by the animals you love.</p>
        <div className="stagger-children mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {home.animalTypes.map((a) => (
            <Link
              key={a}
              href={`/shop?animal=${encodeURIComponent(a)}`}
              className="mesh-panel rounded-2xl px-3 py-5 text-center text-sm font-medium text-ink-900 ring-1 ring-stone-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-brand-300"
            >
              {a}
            </Link>
          ))}
        </div>
      </section>

      <ProductRail title="Popular right now" products={home.popularProducts} />
      <ProductRail title="On sale" products={home.deals} />
      <ProductRail title="New from our shops" products={home.newArrivals} />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl">Featured stores</h2>
        <p className="mt-2 text-stone-600">Independent shops, one checkout.</p>
        <div className="stagger-children mt-6 grid gap-4 md:grid-cols-3">
          {home.featuredStores.map((s) => (
            <Link
              key={s.slug}
              href={`/stores/${s.slug}`}
              className="group mesh-panel rounded-2xl p-6 ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-300"
            >
              <p className="font-display text-xl text-ink-900 transition group-hover:text-brand-800">{s.name}</p>
              <p className="mt-2 text-sm text-stone-600">{s.tagline}</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-700 opacity-0 transition group-hover:opacity-100">
                Visit store →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductRail({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl">{title}</h2>
        <Link href="/shop" className="text-sm font-medium text-brand-700 transition hover:text-brand-900">
          View all
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
