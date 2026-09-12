import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-900/10 bg-ink-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm md:grid-cols-4">
        <div className="md:col-span-1">
          <BrandLogo href="/" variant="light" size="lg" />
          <p className="mt-3 leading-relaxed text-stone-400">
            A marketplace for independent pet shops. One cart, many makers.
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Shop</p>
          <Link href="/shop" className="block transition hover:text-white">
            All products
          </Link>
          <Link href="/stores" className="block transition hover:text-white">
            Stores
          </Link>
          <Link href="/deals" className="block transition hover:text-white">
            Deals
          </Link>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Sell</p>
          <Link href="/sell" className="block transition hover:text-white">
            Open a store
          </Link>
          <Link href="/vendor" className="block transition hover:text-white">
            Vendor dashboard
          </Link>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Help</p>
          <Link href="/pages/about" className="block transition hover:text-white">
            About
          </Link>
          <Link href="/pages/shipping" className="block transition hover:text-white">
            Shipping
          </Link>
          <Link href="/pages/returns" className="block transition hover:text-white">
            Returns
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} PawMarket</p>
          <p>Demo: admin@pawmarket.local · Password123!</p>
        </div>
      </div>
    </footer>
  );
}
