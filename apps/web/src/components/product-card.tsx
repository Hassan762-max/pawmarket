import Link from "next/link";
import { mediaUrl, money } from "@/lib/api";

export type ProductCardData = {
  name: string;
  slug: string;
  brand?: string;
  image: string | null;
  priceFrom: number;
  hasSale?: boolean;
  store: { name: string; slug?: string };
  ratingAvg?: number;
};

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const delay = Math.min(index, 7) * 0.05;
  const src = mediaUrl(product.image);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/80 shadow-soft ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-lift hover:ring-brand-300/60"
      style={{ animation: `fade-up 0.55s ease-out ${delay}s both` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">No image</div>
        )}
        {product.hasSale ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-700 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white shadow-soft">
            Sale
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/25 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{product.store.name}</p>
        <p className="mt-1 line-clamp-2 font-medium leading-snug text-ink-900 transition group-hover:text-brand-800">
          {product.name}
        </p>
        <p className="mt-auto pt-3 text-sm font-semibold text-brand-800">
          {product.hasSale ? "From " : ""}
          {money(product.priceFrom)}
        </p>
      </div>
    </Link>
  );
}
